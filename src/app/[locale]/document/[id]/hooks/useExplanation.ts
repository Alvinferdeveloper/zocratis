import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { api } from "@/lib/api-client";
import { useRefreshUsage } from "@/app/[locale]/subscription/hooks/useSubscription";

// POST /ai/explain.
export interface Explanation {
  coreIdea: string;
  explanation: string;
  keyTerms: string[];
  definedOnPage: number | null;
  check: { question: string; answer: string } | null;
}

export type ExplainLevel = 1 | 2 | 3;
export const MAX_EXPLAIN_LEVEL: ExplainLevel = 3;

export interface ExplainSubject {
  text: string;
  pageNumber: number;
}

const PASSAGE = "";

const explanationKey = (documentId: string, subject: ExplainSubject, term: string, level: ExplainLevel) =>
  ["explanation", documentId, subject.pageNumber, subject.text, term, level] as const;

const sameTerm = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

// The passage and every term opened from it, each with its own level. Explanations are cached by
// passage, term and level, so going back or reopening a term never calls (or charges) again.
export const useExplanation = (documentId: string, subject: ExplainSubject) => {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const refreshUsage = useRefreshUsage();
  const [trail, setTrail] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, ExplainLevel>>({});

  const term = trail.at(-1) ?? PASSAGE;
  const level = levels[term] ?? 1;
  const previous =
    level > 1
      ? queryClient.getQueryData<Explanation>(explanationKey(documentId, subject, term, (level - 1) as ExplainLevel))
      : undefined;

  const query = useQuery({
    queryKey: explanationKey(documentId, subject, term, level),
    queryFn: async () => {
      try {
        const { data } = await api.post<{ explanation: Explanation }>("/ai/explain", {
          documentId,
          text: subject.text,
          pageNumber: subject.pageNumber,
          term: term || undefined,
          level,
          previous: previous && { coreIdea: previous.coreIdea, explanation: previous.explanation },
          explainedTerms: trail,
          responseLanguage: locale,
        });
        return data.explanation;
      } finally {
        refreshUsage();
      }
    },
    // Each call spends a credit: never refetch on its own.
    enabled: level === 1 || previous !== undefined,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // The model is told the trail too; this keeps the student from walking in circles regardless.
  const keyTerms = (query.data?.keyTerms ?? []).filter((candidate) => !trail.some((seen) => sameTerm(seen, candidate)));

  return {
    explanation: query.data ? { ...query.data, keyTerms } : null,
    isLoading: query.isFetching,
    error: query.error,
    retry: () => query.refetch(),
    term: term || null,
    trail,
    level,
    simplify: () => setLevels((current) => ({ ...current, [term]: Math.min(level + 1, MAX_EXPLAIN_LEVEL) as ExplainLevel })),
    openTerm: (next: string) => setTrail((current) => [...current, next]),
    back: () => setTrail((current) => current.slice(0, -1)),
  };
};
