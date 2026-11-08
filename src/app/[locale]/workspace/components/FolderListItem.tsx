import { useTranslations } from "next-intl";
import { ROUTES } from "@/config/routes";
import FolderIcon from "@/app/icons/Folder";
import { ItemRow } from "@/app/[locale]/workspace/components/items/ItemRow";
import { ItemActions } from "@/app/[locale]/workspace/components/items/ItemActions";
import { RelativeDate } from "@/app/[locale]/workspace/components/items/RelativeDate";
import { useFolderSummary } from "@/app/[locale]/workspace/hooks/useFolderSummary";
import type { FolderItemProps } from "@/app/[locale]/workspace/components/items/types";

export const FolderListItem: React.FC<FolderItemProps> = ({ folder, onToggleStar, onDelete, ...selection }) => {
  const t = useTranslations("workspace.items");
  const summary = useFolderSummary(folder);

  return (
    <ItemRow
      href={ROUTES.workspaceCollection(folder.topicId ?? "", folder.id)}
      name={folder.name}
      icon={<FolderIcon size={20} color={folder.color} />}
      subtitle={summary}
      date={<RelativeDate date={folder.updatedAt} fallback={t("unknownDate")} />}
      actions={
        <ItemActions itemType="folder" isStarred={folder.isStarred} onToggleStar={onToggleStar} onDelete={onDelete} className="justify-end" />
      }
      {...selection}
    />
  );
};
