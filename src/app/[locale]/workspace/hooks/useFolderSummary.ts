import { useTranslations } from 'next-intl';
import type { Folder } from '@/app/types';

// "3 archivos · 1 carpeta"
export const useFolderSummary = (folder: Folder): string => {
  const t = useTranslations('workspace.items');
  return [
    t('fileCount', { count: folder.count }),
    folder.subfoldersCount > 0 && t('folderCount', { count: folder.subfoldersCount }),
  ]
    .filter(Boolean)
    .join(' · ');
};
