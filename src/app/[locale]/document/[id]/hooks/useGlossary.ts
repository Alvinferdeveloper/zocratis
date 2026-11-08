import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// GET /ai/documents/:id/glossary: the terms the student opened in this document.
export interface GlossaryEntry {
  // As the document writes it.
  term: string;
  // In the student's language, when the document uses another one.
  translation: string | null;
  coreIdea: string;
  definedOnPage: number | null;
}

export const glossaryKey = (documentId: string) => ["glossary", documentId] as const;

export const useGlossary = (documentId: string) =>
  useQuery({
    queryKey: glossaryKey(documentId),
    queryFn: async () => (await api.get<GlossaryEntry[]>(`/ai/documents/${documentId}/glossary`)).data,
  });
