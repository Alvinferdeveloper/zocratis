import { useTranslations } from "next-intl";
import { ROUTES } from "@/config/routes";
import { getReadingProgress } from "@/app/[locale]/workspace/lib/reading-progress";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";
import { ReadingProgressBar } from "@/app/[locale]/workspace/components/ReadingProgressBar";
import { ItemTile } from "@/app/[locale]/workspace/components/items/ItemTile";
import { ItemActions } from "@/app/[locale]/workspace/components/items/ItemActions";
import { RelativeDate } from "@/app/[locale]/workspace/components/items/RelativeDate";
import type { DocumentItemProps } from "@/app/[locale]/workspace/components/items/types";

export const DocumentCard: React.FC<DocumentItemProps> = ({ doc, collection, onToggleStar, onDelete, ...selection }) => {
  const t = useTranslations("workspace");
  const progress = getReadingProgress(doc);
  const reading = progress
    ? t("progress.pageOf", { page: progress.lastPage, total: progress.pageCount })
    : doc.pageCount && t("items.pageCount", { count: doc.pageCount });
  const details = [collection?.name, reading].filter(Boolean);

  return (
    <ItemTile
      href={ROUTES.document(doc.id)}
      name={doc.fileName}
      tint={collection?.color ?? "var(--muted-foreground)"}
      preview={<PaperSheet bookmarked={!!progress && progress.ratio < 1} />}
      footer={progress && <ReadingProgressBar ratio={progress.ratio} className="absolute inset-x-3 bottom-3" />}
      meta={
        <>
          {details.length > 0 && `${details.join(" · ")} · `}
          <RelativeDate date={doc.lastAccessedAt} fallback={t("items.neverOpened")} />
        </>
      }
      actions={
        <ItemActions
          itemType="document"
          variant="tile"
          isStarred={doc.isStarred}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
          downloadHref={doc.filePath}
        />
      }
      {...selection}
    />
  );
};
