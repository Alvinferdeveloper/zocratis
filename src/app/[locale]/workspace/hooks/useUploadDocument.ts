import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Document } from '@/app/types';
import { invalidateWorkspace } from '@/app/[locale]/workspace/lib/workspace-cache';

interface UploadVariables {
  formData: FormData;
  // Share of the file sent, from 0 to 1.
  onProgress?: (ratio: number) => void;
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<Document, Error, UploadVariables>({
    mutationFn: async ({ formData, onProgress }) => {
      const { data } = await api.post<Document>('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(event.loaded / event.total);
        },
      });
      return data;
    },
    onSuccess: () => invalidateWorkspace(queryClient),
    // Changes the documents and storage quotas.
    meta: { refreshesUsage: true },
  });
};
