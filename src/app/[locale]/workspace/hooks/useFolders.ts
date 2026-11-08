import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Folder } from '@/app/types';
import { invalidateWorkspace } from '@/app/[locale]/workspace/lib/workspace-cache';

type NewFolder = { name: string; color: string; topicId: string; parentId?: string };

// Every folder of a collection, flat, so a folder's path can be rebuilt from its parentId chain.
export const useFetchFolders = (topicId: string | null) =>
  useQuery<Folder[], Error>({
    queryKey: ['folders', topicId],
    queryFn: async () => {
      const { data } = await api.get<Folder[]>('/folders', { params: { topicId } });
      return data;
    },
    enabled: !!topicId,
  });

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<Folder, Error, NewFolder>({
    mutationFn: async (newFolder) => {
      const { data } = await api.post<Folder>('/folders', newFolder);
      return data;
    },
    onSuccess: () => invalidateWorkspace(queryClient),
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/folders/${id}`);
    },
    onSuccess: () => invalidateWorkspace(queryClient),
  });
};
