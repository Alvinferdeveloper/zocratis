import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface VisualQueryRequest {
  question: string;
  imageBase64: string;
  pageNumber?: number;
  regionText?: string;
}

const postVisualQuery = async (
  documentId: string,
  request: VisualQueryRequest
): Promise<string> => {
  const { data } = await api.post(`/documents/${documentId}/visual-query`, request);
  return data.answer;
};

export const useVisualQuery = (documentId: string) => {
  return useMutation<string, Error, VisualQueryRequest>({
    mutationFn: (request) => postVisualQuery(documentId, request),
    meta: { inlineError: true, refreshesUsage: true },
  });
};
