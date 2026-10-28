import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Annotation, AnnotationOrigin } from '@/app/types';
import { flashcardKeys } from '@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards';

const fetchAnnotations = async (documentId: string): Promise<Annotation[]> => {
  const { data } = await api.get(`/documents/${documentId}/annotations`);
  return data;
};

export const useFetchAnnotations = (documentId: string) => {
  return useQuery<Annotation[], Error>({
    queryKey: ['annotations', documentId],
    queryFn: () => fetchAnnotations(documentId),
  });
};

export const useFetchAnnotationsByPage = (documentId: string, pageNumber: number) => {
  return useQuery<Annotation[], Error>({
    queryKey: ['annotations', documentId, pageNumber],
    queryFn: () => fetchAnnotationsByPage(documentId, pageNumber),
    enabled: !!documentId && !!pageNumber,
  });
};

const fetchAnnotationsByPage = async (documentId: string, pageNumber: number): Promise<Annotation[]> => {
  const { data } = await api.get(`/documents/${documentId}/annotations/page/${pageNumber}`);
  return data;
};

interface CreateAnnotationRequest {
    selectedText: string;
    comment?: string;
    aiResponse?: string;
    color: string;
    pageNumber: number;
    origin?: AnnotationOrigin;
    // Required for highlighted notes; chat notes have none.
    boundingRect?: { x1: number; y1: number; x2: number; y2: number; width: number; height: number; pageNumber: number };
    rects?: { x1: number; y1: number; x2: number; y2: number; width: number; height: number; pageNumber: number }[];
    embedding?: string;
}

const createAnnotation = async (documentId: string, annotation: CreateAnnotationRequest): Promise<Annotation> => {
  const { data } = await api.post(`/documents/${documentId}/annotations`, annotation);
  return data;
};

export const useCreateAnnotation = (documentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Annotation, Error, CreateAnnotationRequest>({
    mutationFn: (annotation) => createAnnotation(documentId, annotation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', documentId] });
    },
    // The note dialog shows save failures itself.
    meta: { inlineError: true },
  });
};

const deleteAnnotation = async (annotationId: string): Promise<void> => {
  await api.delete(`/annotations/${annotationId}`);
};

export const useDeleteAnnotation = (documentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (annotationId) => deleteAnnotation(annotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', documentId] });
      // The note's cards stay, detached from it.
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
};

interface UpdateAnnotationRequest {
    comment?: string;
    aiResponse?: string;
    color?: string;
    boundingRect?: { x1: number; y1: number; x2: number; y2: number; width: number; height: number; pageNumber: number };
    rects?: { x1: number; y1: number; x2: number; y2: number; width: number; height: number; pageNumber: number }[];
}

const updateAnnotation = async (annotationId: string, update: UpdateAnnotationRequest): Promise<Annotation> => {
  const { data } = await api.patch(`/annotations/${annotationId}`, update);
  return data;
};

export const useUpdateAnnotation = (documentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Annotation, Error, { annotationId: string; update: UpdateAnnotationRequest }>({
    mutationFn: ({ annotationId, update }) => updateAnnotation(annotationId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', documentId] });
    },
    meta: { inlineError: true },
  });
};
