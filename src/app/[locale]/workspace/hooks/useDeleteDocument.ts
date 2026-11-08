import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { invalidateWorkspace } from '@/app/[locale]/workspace/lib/workspace-cache';

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (documentId) => {
      await api.delete(`/documents/${documentId}`);
    },
    onSuccess: () => invalidateWorkspace(queryClient),
    // Changes the documents and storage quotas.
    meta: { refreshesUsage: true },
  });
};
