import { useMemo } from 'react';
import type { Document, Folder } from '@/app/types';
import type { SortBy } from '@/app/[locale]/workspace/lib/view-mode';
import { useFetchItems } from '@/app/[locale]/workspace/hooks/useFetchItems';
import { useFetchRecentDocuments } from '@/app/[locale]/workspace/hooks/useFetchRecentDocuments';

export type WorkspaceItem = Document | Folder;

interface WorkspaceItemsOptions {
  topicId: string | null;
  folderId: string | null;
  search: string;
  sortBy: SortBy;
}

const lastTouched = (doc: Document): number => new Date(doc.lastAccessedAt || doc.createdAt).getTime();

// Recent documents without a collection open, otherwise the open collection or folder, paginated.
export const useWorkspaceItems = ({ topicId, folderId, search, sortBy }: WorkspaceItemsOptions) => {
  const isRecent = !topicId;
  const recent = useFetchRecentDocuments(search, isRecent);
  const collection = useFetchItems(topicId ?? undefined, search, folderId, sortBy, !isRecent);

  // Recent arrives whole, so it sorts here; collections page from the API, which already sorts them.
  const recentItems = useMemo(() => {
    const docs = (recent.data ?? []).map((doc) => ({ ...doc, type: 'document' as const }));
    return sortBy === 'name'
      ? docs.sort((a, b) => a.fileName.localeCompare(b.fileName))
      : docs.sort((a, b) => lastTouched(b) - lastTouched(a));
  }, [recent.data, sortBy]);

  if (isRecent) {
    return {
      items: recentItems as WorkspaceItem[],
      recentDocuments: recent.data ?? [],
      total: recentItems.length,
      isLoading: recent.isPending,
    };
  }

  return {
    items: collection.data?.pages.flatMap((page) => page.data) ?? [],
    recentDocuments: [],
    total: collection.data?.pages[0]?.total ?? 0,
    isLoading: collection.isPending,
    hasNextPage: collection.hasNextPage,
    isFetchingNextPage: collection.isFetchingNextPage,
    fetchNextPage: collection.fetchNextPage,
  };
};
