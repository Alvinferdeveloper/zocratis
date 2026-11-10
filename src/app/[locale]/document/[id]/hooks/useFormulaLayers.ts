import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { api } from "@/lib/api-client";
import { useRefreshUsage } from "@/app/[locale]/subscription/hooks/useSubscription";
import type { ExplainSubject } from "@/app/[locale]/document/[id]/hooks/useExplanation";

export interface FormulaSymbol {
  latex: string;
  text: string;
  meaning: string;
  definition: { page: number; excerpt: string } | null;
}

export interface FormulaExample {
  setup: string;
  steps: { label: string; latex: string; expression: string; result: number }[];
  conclusion: string;
}

// POST /ai/formula.
export interface FormulaLayers {
  latex: string;
  symbols: FormulaSymbol[];
  intuition: string;
  example: FormulaExample | null;
  check: { question: string; answer: string } | null;
}

// The API keeps a formula's layers, so opening it again is free; only "think again" isn't.
export const useFormulaLayers = (documentId: string, subject: ExplainSubject) => {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const refreshUsage = useRefreshUsage();
  const key = ["formula", documentId, subject.id] as const;

  const request = async (regenerate: boolean) => {
    try {
      const { data } = await api.post<{ formula: FormulaLayers }>("/ai/formula", {
        documentId,
        subjectId: subject.id,
        regenerate: regenerate || undefined,
        text: subject.text,
        image: subject.image,
        pageNumber: subject.pageNumber,
        responseLanguage: locale,
      });
      return data.formula;
    } finally {
      refreshUsage();
    }
  };

  const query = useQuery({
    queryKey: key,
    queryFn: () => request(false),
    // Never refetch on its own: new layers are only made when the student asks for them.
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const thinkAgain = useMutation({
    mutationFn: () => request(true),
    onSuccess: (layers) => queryClient.setQueryData(key, layers),
    meta: { inlineError: true },
  });

  return {
    layers: query.data ?? null,
    isLoading: query.isFetching || thinkAgain.isPending,
    error: query.error ?? thinkAgain.error,
    retry: () => query.refetch(),
    thinkAgain: () => thinkAgain.mutate(),
  };
};
