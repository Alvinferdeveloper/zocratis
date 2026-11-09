import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { VocabularyEntry } from "@/app/types";

export const FLASHCARD_SOURCES = ["manual", "note", "vocabulary", "check", "feynman"] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];

export type FlashcardState = "new" | "learning" | "review" | "relearning";

// Mirrors the API's flashcard entity (estudia-api `Flashcard.entity.ts`).
export interface Flashcard {
  id: string;
  documentId: string;
  source: FlashcardSource;
  vocabularyEntryId: string | null;
  annotationId: string | null;
  front: string;
  // Markdown.
  back: string;
  pageNumber: number | null;
  // When spaced repetition shows it next.
  due: string;
  state: FlashcardState;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardContent {
  front: string;
  back: string;
}

// Every key starts with "flashcards", so any change to cards refreshes lists, summaries and due cards together.
export const flashcardKeys = {
  all: ["flashcards"] as const,
  document: (documentId: string) => ["flashcards", "document", documentId] as const,
  due: (documentId?: string) => ["flashcards", "due", documentId ?? "all"] as const,
  summary: (documentId?: string) => ["flashcards", "summary", documentId ?? "all"] as const,
};

export const useFlashcards = (documentId: string) =>
  useQuery({
    queryKey: flashcardKeys.document(documentId),
    queryFn: async () => {
      const { data } = await api.get<Flashcard[]>(`/documents/${documentId}/flashcards`);
      return data;
    },
  });

const useInvalidateFlashcards = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
};

export const useCreateFlashcard = (documentId: string) => {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: async (card: FlashcardContent & { pageNumber?: number; source?: "manual" | "check" | "feynman" }) => {
      const { data } = await api.post<Flashcard>(`/documents/${documentId}/flashcards`, card);
      return data;
    },
    onSuccess: invalidate,
    meta: { inlineError: true },
  });
};

export const useUpdateFlashcard = () => {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: async ({ id, ...card }: FlashcardContent & { id: string }) => {
      const { data } = await api.patch<Flashcard>(`/flashcards/${id}`, card);
      return data;
    },
    onSuccess: invalidate,
    meta: { inlineError: true },
  });
};

export const useDeleteFlashcard = () => {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/flashcards/${id}`);
    },
    onSuccess: invalidate,
  });
};

// Saved words with an explanation to build a card from and no card yet.
export const wordsOutsideDeck = (words: VocabularyEntry[], cards: Flashcard[]): VocabularyEntry[] => {
  const carded = new Set(cards.map((card) => card.vocabularyEntryId));
  return words.filter((word) => word.explanation?.meanings.length && !carded.has(word.id));
};

// Omitting the ids adds every saved word of the document that has no card yet.
export const useAddWordsToFlashcards = (documentId: string) => {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: async (vocabularyEntryIds?: string[]) => {
      const { data } = await api.post<{ added: number }>(`/documents/${documentId}/flashcards/from-vocabulary`, {
        vocabularyEntryIds,
      });
      return data;
    },
    onSuccess: invalidate,
  });
};

// Charges a credit; nothing is saved until the user keeps some of the proposals.
export const useGenerateNoteFlashcards = () =>
  useMutation({
    mutationFn: async (annotationId: string) => {
      const { data } = await api.post<{ cards: FlashcardContent[] }>(`/annotations/${annotationId}/flashcards/proposals`, {});
      return data.cards;
    },
    meta: { inlineError: true, refreshesUsage: true },
  });

export const useSaveNoteFlashcards = () => {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: async ({ annotationId, cards }: { annotationId: string; cards: FlashcardContent[] }) => {
      const { data } = await api.post<Flashcard[]>(`/annotations/${annotationId}/flashcards`, { cards });
      return data;
    },
    onSuccess: invalidate,
    meta: { inlineError: true },
  });
};
