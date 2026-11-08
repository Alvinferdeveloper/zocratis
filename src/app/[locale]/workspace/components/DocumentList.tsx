import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { Topic } from "@/app/types";
import { ROW_GRID } from "@/app/[locale]/workspace/lib/item-styles";
import { ITEMS_LAYOUT, type ViewMode } from "@/app/[locale]/workspace/lib/view-mode";
import type { WorkspaceItem } from "@/app/[locale]/workspace/hooks/useWorkspaceItems";
import type { useSelection } from "@/app/[locale]/workspace/hooks/useSelection";
import { useLoadMoreOnScroll } from "@/app/[locale]/workspace/hooks/useLoadMoreOnScroll";
import { DocumentCard } from "@/app/[locale]/workspace/components/DocumentCard";
import { DocumentListItem } from "@/app/[locale]/workspace/components/DocumentListItem";
import { FolderCard } from "@/app/[locale]/workspace/components/FolderCard";
import { FolderListItem } from "@/app/[locale]/workspace/components/FolderListItem";
import { ItemsSkeleton } from "@/app/[locale]/workspace/components/ItemsSkeleton";

export interface ItemHandlers {
  deleteDocument: (id: string) => void;
  deleteFolder: (id: string) => void;
  toggleDocumentStar: (toggle: { id: string; isStarred: boolean }) => void;
  toggleFolderStar: (toggle: { id: string; isStarred: boolean }) => void;
}

interface DocumentListProps {
  items: WorkspaceItem[];
  viewMode: ViewMode;
  collections: Topic[];
  // Name each document's collection, where documents of several collections mix.
  showCollection: boolean;
  selection: ReturnType<typeof useSelection>;
  handlers: ItemHandlers;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

const ListHeader: React.FC<{ allSelected: boolean; onToggleAll: () => void }> = ({ allSelected, onToggleAll }) => {
  const t = useTranslations("workspace.list");

  return (
    <div className={cn(ROW_GRID, "border-b border-border/60 px-2 pb-2 text-xs font-medium text-muted-foreground")}>
      <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label={t("selectAll")} />
      <span>{t("columns.name")}</span>
      <span className="hidden md:block">{t("columns.reading")}</span>
      <span className="hidden md:block">{t("columns.lastOpened")}</span>
    </div>
  );
};

export const DocumentList: React.FC<DocumentListProps> = ({
  items,
  viewMode,
  collections,
  showCollection,
  selection,
  handlers,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const sentinelRef = useLoadMoreOnScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });
  const selectionMode = selection.count > 0;

  return (
    <div>
      {viewMode === "list" && <ListHeader allSelected={selection.allSelected} onToggleAll={selection.toggleAll} />}

      <div className={cn(ITEMS_LAYOUT[viewMode], "py-2")}>
        {items.map((item) => {
          const shared = {
            isSelected: selection.selectedIds.has(item.id),
            selectionMode,
            onToggleSelect: () => selection.toggle(item.id),
          };

          if (item.type === "folder") {
            const FolderItem = viewMode === "grid" ? FolderCard : FolderListItem;
            return (
              <FolderItem
                key={item.id}
                folder={item}
                onToggleStar={() => handlers.toggleFolderStar({ id: item.id, isStarred: !item.isStarred })}
                onDelete={() => handlers.deleteFolder(item.id)}
                {...shared}
              />
            );
          }

          const DocumentItem = viewMode === "grid" ? DocumentCard : DocumentListItem;
          return (
            <DocumentItem
              key={item.id}
              doc={item}
              collection={showCollection ? collections.find((collection) => collection.id === item.topicId) : undefined}
              onToggleStar={() => handlers.toggleDocumentStar({ id: item.id, isStarred: !item.isStarred })}
              onDelete={() => handlers.deleteDocument(item.id)}
              {...shared}
            />
          );
        })}

        {isFetchingNextPage && <ItemsSkeleton viewMode={viewMode} count={3} />}
      </div>

      <div ref={sentinelRef} aria-hidden className="h-px" />
    </div>
  );
};
