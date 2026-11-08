import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useUploadDocument } from '@/app/[locale]/workspace/hooks/useUploadDocument';
import { useUsage } from '@/app/[locale]/subscription/hooks/useSubscription';
import { isQuotaFull } from '@/app/[locale]/subscription/lib/usage';

export type UploadStatus = 'uploading' | 'done' | 'failed';

export interface UploadItem {
  id: string;
  name: string;
  // Share of the file sent, from 0 to 1.
  progress: number;
  status: UploadStatus;
}

interface UploadTarget {
  topicId: string | null;
  folderId: string | null;
}

const PDF_MIME_TYPE = 'application/pdf';
const SETTLED_DISMISS_MS = 2500;

// Uploads PDFs one by one into the open collection or folder, tracking each file's progress.
export const useDocumentUpload = ({ topicId, folderId }: UploadTarget) => {
  const t = useTranslations('workspace.upload');
  const { mutateAsync } = useUploadDocument();
  const { data: usage } = useUsage();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // The API refuses it anyway; knowing it up front lets the UI say why before a file is picked.
  const isBlocked = !!usage && (isQuotaFull(usage.quotas.documents) || isQuotaFull(usage.quotas.storageBytes));

  const update = (id: string, patch: Partial<UploadItem>) =>
    setUploads((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter((file) => file.type === PDF_MIME_TYPE);
      if (pdfs.length < files.length) toast.error(t('pdfOnly'));

      const queue = pdfs.map((file) => ({
        file,
        item: { id: crypto.randomUUID(), name: file.name, progress: 0, status: 'uploading' as const },
      }));
      setUploads((previous) => [...previous, ...queue.map(({ item }) => item)]);

      for (const { file, item } of queue) {
        const formData = new FormData();
        formData.append('file', file);
        if (topicId) formData.append('topicId', topicId);
        if (folderId) formData.append('folderId', folderId);
        try {
          await mutateAsync({ formData, onProgress: (progress) => update(item.id, { progress }) });
          update(item.id, { status: 'done', progress: 1 });
        } catch {
          update(item.id, { status: 'failed' });
        }
      }
    },
    [topicId, folderId, mutateAsync, t],
  );

  const isUploading = uploads.some((item) => item.status === 'uploading');

  // Finished uploads leave on their own; failed ones stay until dismissed.
  useEffect(() => {
    if (isUploading || !uploads.some((item) => item.status === 'done')) return;
    const timer = setTimeout(
      () => setUploads((previous) => previous.filter((item) => item.status !== 'done')),
      SETTLED_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [isUploading, uploads]);

  const dismiss = useCallback(
    () => setUploads((previous) => previous.filter((item) => item.status === 'uploading')),
    [],
  );

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);

  const inputProps = {
    ref: inputRef,
    type: 'file',
    accept: PDF_MIME_TYPE,
    multiple: true,
    hidden: true,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      uploadFiles(Array.from(event.target.files ?? []));
      event.target.value = '';
    },
  } as const;

  return { uploads, isUploading, isBlocked, uploadFiles, openFilePicker, inputProps, dismiss };
};
