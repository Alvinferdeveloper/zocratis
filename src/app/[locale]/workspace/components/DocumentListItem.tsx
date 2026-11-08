import { useTranslations } from "next-intl";
import { ROUTES } from "@/config/routes";
import { getReadingProgress } from "@/app/[locale]/workspace/lib/reading-progress";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";
import { ItemRow } from "@/app/[locale]/workspace/components/items/ItemRow";
import { ItemActions } from "@/app/[locale]/workspace/components/items/ItemActions";
import { ReadingStatus } from "@/app/[locale]/workspace/components/items/ReadingStatus";
import { RelativeDate } from "@/app/[locale]/workspace/components/items/RelativeDate";
import type { DocumentItemProps } from "@/app/[locale]/workspace/components/items/types";

export const DocumentListItem: React.FC<DocumentItemProps> = ({ doc, collection, onToggleStar, onDelete, ...selection }) => {
  const t = useTranslations("workspace.items");
  const progress = getReadingProgress(doc);
  const subtitle = [collection?.name, doc.pageCount && t("pageCount", { count: doc.pageCount })].filter(Boolean).join(" · ");

  return (
    <ItemRow
      href={ROUTES.document(doc.id)}
      name={doc.fileName}
      icon={<PaperSheet size="sm" bookmarked={!!progress && progress.ratio < 1} />}
      subtitle={subtitle}
      status={<ReadingStatus progress={progress} />}
      date={<RelativeDate date={doc.lastAccessedAt} fallback={t("neverOpened")} />}
      actions={
        <ItemActions
          itemType="document"
          isStarred={doc.isStarred}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
          downloadHref={doc.filePath}
          className="justify-end"
        />
      }
      {...selection}
    />
  );
};
