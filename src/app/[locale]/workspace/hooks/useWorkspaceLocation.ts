import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Folder, Topic } from '@/app/types';
import { useFetchTopics } from '@/app/[locale]/workspace/hooks/useFetchTopics';
import { useFetchFolders } from '@/app/[locale]/workspace/hooks/useFolders';

export interface WorkspaceLocation {
  topicId: string | null;
  folderId: string | null;
  topic: Topic | null;
  // From the collection's root down to the open folder.
  folderPath: Folder[];
  folder: Folder | null;
}

const buildFolderPath = (folders: Folder[], folderId: string | null): Folder[] => {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: Folder[] = [];
  let current = folderId ? byId.get(folderId) : undefined;
  while (current && !path.includes(current)) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
};

// The open collection and folder live in the URL, so back, refresh and shared links keep the place.
export const useWorkspaceLocation = (): WorkspaceLocation => {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic');
  const folderId = topicId ? searchParams.get('folder') : null;
  const { data: topics } = useFetchTopics();
  const { data: folders } = useFetchFolders(topicId);

  return useMemo(() => {
    const folderPath = buildFolderPath(folders ?? [], folderId);
    return {
      topicId,
      folderId,
      topic: topics?.find((topic) => topic.id === topicId) ?? null,
      folderPath,
      folder: folderPath.at(-1) ?? null,
    };
  }, [topicId, folderId, topics, folders]);
};
