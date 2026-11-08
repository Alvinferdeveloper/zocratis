import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { invalidateWorkspace } from '@/app/[locale]/workspace/lib/workspace-cache';

type StarToggle = { id: string; isStarred: boolean };

const useToggleStar = (resource: 'documents' | 'folders') => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, StarToggle>({
    mutationFn: async ({ id, isStarred }) => {
      await api.patch(`/${resource}/${id}/star`, { isStarred });
    },
    onSuccess: () => invalidateWorkspace(queryClient),
  });
};

export const useToggleDocumentStar = () => useToggleStar('documents');

export const useToggleFolderStar = () => useToggleStar('folders');
