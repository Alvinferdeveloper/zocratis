import { ROUTES } from "@/config/routes";
import FolderIcon from "@/app/icons/Folder";
import { ItemTile } from "@/app/[locale]/workspace/components/items/ItemTile";
import { ItemActions } from "@/app/[locale]/workspace/components/items/ItemActions";
import { useFolderSummary } from "@/app/[locale]/workspace/hooks/useFolderSummary";
import type { FolderItemProps } from "@/app/[locale]/workspace/components/items/types";

export const FolderCard: React.FC<FolderItemProps> = ({ folder, onToggleStar, onDelete, ...selection }) => {
  const summary = useFolderSummary(folder);

  return (
    <ItemTile
      href={ROUTES.workspaceCollection(folder.topicId ?? "", folder.id)}
      name={folder.name}
      tint={folder.color || "var(--muted-foreground)"}
      preview={<FolderIcon size={56} color={folder.color} />}
      meta={summary}
      actions={
        <ItemActions itemType="folder" variant="tile" isStarred={folder.isStarred} onToggleStar={onToggleStar} onDelete={onDelete} />
      }
      {...selection}
    />
  );
};
