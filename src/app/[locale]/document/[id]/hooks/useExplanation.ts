import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { api } from "@/lib/api-client";
import { useRefreshUsage } from "@/app/[locale]/subscription/hooks/useSubscription";
import { glossaryKey } from "@/app/[locale]/document/[id]/hooks/useGlossary";
import type { RegionKind } from "@/app/[locale]/document/[id]/lib/page-regions";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// A term as the document writes it, and in the student's language when that differs.
export interface KeyTerm {
  original: string;
  translation: string | null;
}

// POST /ai/explain.
export interface Explanation {
  coreIdea: string;
  explanation: string;
  keyTerms: KeyTerm[];
  // When explaining a term: that term in the student's language, if the document uses another one.
  termTranslation: string | null;
  definedOnPage: number | null;
  check: { question: string; answer: string } | null;
}

export type ExplainLevel = 1 | 2 | 3;
export const MAX_EXPLAIN_LEVEL: ExplainLevel = 3;

export interface ExplainSubject {
  // Tells subjects apart in the cache: two figures on a page can have the same (empty) text.
  id: string;
  // The selected passage, or the text pdf.js found in a region.
  text: string;
  pageNumber: number;
  // A region of the page (figure, table, formula, or a hand-made crop), sent as an image.
  image?: string;
  // What the parser detected; absent for a crop.
  regionKind?: RegionKind;
  // Where the image comes from, so a chat that follows can show it again later.
  region?: PageRegion;
}

const PASSAGE = "";

const explanationKey = (documentId: string, subject: ExplainSubject, term: string, level: ExplainLevel) =>
  ["explanation", documentId, subject.id, term, level] as const;

const sameTerm = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

// The passage and every term opened from it, each with its own level. The API keeps every
// explanation, so opening the same thing again (even another day) is free; only "think again" isn't.
export const useExplanation = (documentId: string, subject: ExplainSubject) => {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const refreshUsage = useRefreshUsage();
  const [trail, setTrail] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, ExplainLevel>>({});

  const term = trail.at(-1) ?? PASSAGE;
  const level = levels[term] ?? 1;
  const key = explanationKey(documentId, subject, term, level);
  const previous =
    level > 1
      ? queryClient.getQueryData<Explanation>(explanationKey(documentId, subject, term, (level - 1) as ExplainLevel))
      : undefined;

  const request = async (regenerate: boolean) => {
    try {
      const { data } = await api.post<{ explanation: Explanation }>("/ai/explain", {
        documentId,
        subjectId: subject.id,
        regenerate: regenerate || undefined,
        text: subject.text,
        pageNumber: subject.pageNumber,
        image: subject.image,
        regionKind: subject.regionKind,
        term: term || undefined,
        level,
        previous: previous && { coreIdea: previous.coreIdea, explanation: previous.explanation },
        explainedTerms: trail,
        responseLanguage: locale,
      });
      // A term explained for the first time joins the document's glossary.
      if (term) queryClient.invalidateQueries({ queryKey: glossaryKey(documentId) });
      return data.explanation;
    } finally {
      refreshUsage();
    }
  };

  const query = useQuery({
    queryKey: key,
    queryFn: () => request(false),
    // Never refetch on its own: a new explanation is only made when the student asks for one.
    enabled: level === 1 || previous !== undefined,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const thinkAgain = useMutation({
    mutationFn: () => request(true),
    onSuccess: (explanation) => queryClient.setQueryData(key, explanation),
    meta: { inlineError: true },
  });

  // The model is told the trail too; this keeps the student from walking in circles regardless.
  const keyTerms = (query.data?.keyTerms ?? []).filter(
    (candidate) => !trail.some((seen) => sameTerm(seen, candidate.original))
  );

  return {
    explanation: query.data ? { ...query.data, keyTerms } : null,
    isLoading: query.isFetching || thinkAgain.isPending,
    error: query.error ?? thinkAgain.error,
    retry: () => query.refetch(),
    thinkAgain: () => thinkAgain.mutate(),
    term: term || null,
    trail,
    level,
    simplify: () => setLevels((current) => ({ ...current, [term]: Math.min(level + 1, MAX_EXPLAIN_LEVEL) as ExplainLevel })),
    // The trail keeps the document's spelling: it is what the API looks up and saves.
    openTerm: (next: KeyTerm) => setTrail((current) => [...current, next.original]),
    back: () => setTrail((current) => current.slice(0, -1)),
  };
};
