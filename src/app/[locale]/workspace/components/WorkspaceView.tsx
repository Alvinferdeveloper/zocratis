"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/app/lib/auth-client";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useTrackOnMount } from "@/lib/product-events";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Document } from "@/app/types";
import { ITEMS_LAYOUT, type SortBy, type ViewMode } from "@/app/[locale]/workspace/lib/view-mode";
import { findDocumentToContinue } from "@/app/[locale]/workspace/lib/reading-progress";
import { useWorkspaceLocation } from "@/app/[locale]/workspace/hooks/useWorkspaceLocation";
import { useWorkspaceItems } from "@/app/[locale]/workspace/hooks/useWorkspaceItems";
import { useSelection } from "@/app/[locale]/workspace/hooks/useSelection";
import { useDocumentUpload } from "@/app/[locale]/workspace/hooks/useDocumentUpload";
import { useWindowFileDrop } from "@/app/[locale]/workspace/hooks/useWindowFileDrop";
import { useFetchTopics } from "@/app/[locale]/workspace/hooks/useFetchTopics";
import { useCreateFolder, useDeleteFolder } from "@/app/[locale]/workspace/hooks/useFolders";
import { useDeleteDocument } from "@/app/[locale]/workspace/hooks/useDeleteDocument";
import { useToggleDocumentStar, useToggleFolderStar } from "@/app/[locale]/workspace/hooks/useToggleStar";
import { Sidebar } from "@/app/[locale]/workspace/components/Sidebar";
import { NewMenu } from "@/app/[locale]/workspace/components/NewMenu";
import { Header } from "@/app/[locale]/workspace/components/Header";
import { SelectionBar } from "@/app/[locale]/workspace/components/SelectionBar";
import { ContinueReading } from "@/app/[locale]/workspace/components/ContinueReading";
import { DocumentList, type ItemHandlers } from "@/app/[locale]/workspace/components/DocumentList";
import { ItemsSkeleton } from "@/app/[locale]/workspace/components/ItemsSkeleton";
import { WorkspaceEmptyState } from "@/app/[locale]/workspace/components/WorkspaceEmptyState";
import { UploadTray } from "@/app/[locale]/workspace/components/UploadTray";
import { DropOverlay } from "@/app/[locale]/workspace/components/DropOverlay";

const SEARCH_DEBOUNCE_MS = 250;

export const WorkspaceView: React.FC = () => {
  const t = useTranslations("workspace");
  const router = useRouter();
  useTrackOnMount("workspace_opened");

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (!session?.data?.user) router.push(ROUTES.login);
    });
  }, [router]);

  const location = useWorkspaceLocation();
  const locationKey = `${location.topicId}/${location.folderId}`;
  const isRecent = !location.topicId;

  const [searchQuery, setSearchQuery] = useState("");
  const search = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => setSearchQuery(""), [locationKey]);

  const { items, recentDocuments, total, isLoading, ...pagination } = useWorkspaceItems({
    topicId: location.topicId,
    folderId: location.folderId,
    search,
    sortBy,
  });
  const { data: collections } = useFetchTopics();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useSelection(itemIds, locationKey);
  const documentToContinue = isRecent && !search ? findDocumentToContinue(recentDocuments) : null;

  const upload = useDocumentUpload({ topicId: location.topicId, folderId: location.folderId });
  const isDraggingFile = useWindowFileDrop(upload.uploadFiles);

  const { mutate: createFolder } = useCreateFolder();
  const { mutate: deleteDocument } = useDeleteDocument();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: toggleDocumentStar } = useToggleDocumentStar();
  const { mutate: toggleFolderStar } = useToggleFolderStar();
  const handlers: ItemHandlers = { deleteDocument, deleteFolder, toggleDocumentStar, toggleFolderStar };

  const selectedItems = items.filter((item) => selection.selectedIds.has(item.id));

  const handleBulkDelete = () => {
    selectedItems.forEach((item) => (item.type === "folder" ? deleteFolder(item.id) : deleteDocument(item.id)));
    selection.clear();
  };

  const handleBulkDownload = () => {
    selectedItems
      .filter((item): item is Document => item.type === "document")
      .forEach((doc) => window.open(doc.filePath, "_blank"));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={ITEMS_LAYOUT[viewMode]}>
          <ItemsSkeleton viewMode={viewMode} />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <WorkspaceEmptyState
          searchQuery={search}
          isRecent={isRecent}
          isUploadBlocked={upload.isBlocked}
          onUpload={upload.openFilePicker}
        />
      );
    }
    return (
      <DocumentList
        items={items}
        viewMode={viewMode}
        collections={collections ?? []}
        showCollection={isRecent}
        selection={selection}
        handlers={handlers}
        {...pagination}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        location={location}
        newMenu={
          <NewMenu
            topicId={location.topicId}
            folderId={location.folderId}
            createFolder={createFolder}
            onUpload={upload.openFilePicker}
            isUploadBlocked={upload.isBlocked}
          />
        }
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/60 px-6">
          {selection.count > 0 ? (
            <SelectionBar
              count={selection.count}
              onClear={selection.clear}
              onDownload={handleBulkDownload}
              onDelete={() => setShowBulkDelete(true)}
            />
          ) : (
            <Header
              location={location}
              itemCount={total}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
          <div className="mx-auto max-w-6xl">
            {documentToContinue && <ContinueReading document={documentToContinue} />}
            {renderContent()}
          </div>
        </div>
      </main>

      <input {...upload.inputProps} />
      <UploadTray uploads={upload.uploads} onDismiss={upload.dismiss} />
      <DropOverlay isVisible={isDraggingFile} destination={location.folder?.name ?? location.topic?.name} />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        onConfirm={handleBulkDelete}
        title={t("bulkDelete.title", { count: selection.count })}
        description={t("bulkDelete.description")}
        confirmText={t("actions.delete")}
        variant="destructive"
      />
    </div>
  );
};
