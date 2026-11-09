import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { RegionKind } from "@/app/[locale]/document/[id]/lib/page-regions";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

export type FeynmanIdeaStatus = "mastered" | "missing" | "confused";

export interface FeynmanIdea {
  idea: string;
  status: FeynmanIdeaStatus;
  feedback: string;
  quote: string | null;
  page: number | null;
  card: { front: string; back: string } | null;
}

export interface FeynmanFeedback {
  ideas: FeynmanIdea[];
  unexplainedTerms: string[];
  question: string | null;
}

// Mirrors FeynmanSubject in the API: enough to set the subject up again for another attempt.
export interface FeynmanSubject {
  id: string;
  kind: "passage" | "region" | "pages";
  pageNumber: number;
  pageTo: number | null;
  text: string | null;
  region: PageRegion | null;
  regionKind: RegionKind | null;
}

export interface FeynmanAttempt {
  id: string;
  subject: FeynmanSubject;
  explanation: string;
  feedback: FeynmanFeedback;
  peeked: boolean;
  createdAt: string;
}

// What the explanation is compared with, read from the PDF for each attempt.
export interface FeynmanSource {
  text: string;
  image?: string;
}

interface FeynmanSubmission {
  subject: FeynmanSubject;
  source: FeynmanSource;
  explanation: string;
  peeked: boolean;
}

const feynmanKey = (documentId: string) => ["feynman", documentId] as const;

export const useFeynmanAttempts = (documentId: string, enabled: boolean) =>
  useQuery({
    queryKey: feynmanKey(documentId),
    queryFn: async () => (await api.get<FeynmanAttempt[]>(`/ai/documents/${documentId}/feynman`)).data,
    enabled,
  });

export const useSubmitFeynman = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subject, source, explanation, peeked }: FeynmanSubmission) => {
      const { data } = await api.post<{ attempt: FeynmanAttempt }>("/ai/feynman", {
        documentId,
        subjectId: subject.id,
        kind: subject.kind,
        text: source.text,
        image: source.image,
        regionKind: subject.regionKind ?? undefined,
        region: subject.region ?? undefined,
        pageNumber: subject.pageNumber,
        pageTo: subject.pageTo ?? undefined,
        explanation,
        peeked,
      });
      return data.attempt;
    },
    onSuccess: (attempt) =>
      queryClient.setQueryData<FeynmanAttempt[]>(feynmanKey(documentId), (current = []) => [...current, attempt]),
    meta: { inlineError: true, refreshesUsage: true },
  });
};
