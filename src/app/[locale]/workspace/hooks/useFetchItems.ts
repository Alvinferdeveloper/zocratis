import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Document, Folder } from '@/app/types';

interface PaginatedItems {
  data: (Document | Folder)[];
  total: number;
  page: number;
  limit: number;
}

const fetchItems = async ({
  pageParam = 1,
  topicId,
  folderId,
  search,
  sortBy,
}: {
  pageParam?: number,
  topicId?: string,
  folderId?: string | null,
  search?: string,
  sortBy?: 'date' | 'name',
}): Promise<PaginatedItems> => {
  let url = `/documents/items?page=${pageParam}&limit=12`;
  if (topicId) url += `&topicId=${topicId}`;
  if (folderId) url += `&folderId=${folderId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (sortBy) url += `&sortBy=${sortBy}`;

  const { data } = await api.get(url);
  return data;
};

export const useFetchItems = (
  topicId?: string,
  search?: string,
  folderId?: string | null,
  sortBy: 'date' | 'name' = 'date',
  enabled = true,
) => {
  return useInfiniteQuery<PaginatedItems, Error>({
    // sortBy is part of the key on purpose: changing it must start a fresh
    // infinite query from page 1 instead of re-sorting partially loaded
    // pages on the client (which would make items jump around mid-scroll).
    queryKey: ['items', topicId, folderId, search, sortBy],
    queryFn: ({ pageParam }) => fetchItems({ pageParam: pageParam as number, topicId, folderId, search, sortBy }),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
  });
};
