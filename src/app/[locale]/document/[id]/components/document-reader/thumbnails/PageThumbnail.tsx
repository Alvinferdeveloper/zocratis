import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import { THUMBNAIL_WIDTH } from "@/app/[locale]/document/[id]/lib/page-thumbnails";
import { usePageThumbnail } from "@/app/[locale]/document/[id]/hooks/usePageThumbnail";
import { cn } from "@/lib/utils";

interface PageThumbnailProps {
  pdf: PdfDocument;
  pageNumber: number;
  isCurrent: boolean;
  // Undefined outside exam mode, where pages can't be selected.
  isSelected?: boolean;
  onClick: () => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ pdf, pageNumber, isCurrent, isSelected, onClick }) => {
  const t = useTranslations("reader.thumbnails");
  const { ref, src } = usePageThumbnail(pdf, pageNumber);
  const selectable = isSelected !== undefined;

  return (
    <button
      ref={ref}
      data-page={pageNumber}
      onClick={onClick}
      aria-current={isCurrent ? "page" : undefined}
      aria-pressed={selectable ? isSelected : undefined}
      aria-label={selectable ? t("selectPage", { page: pageNumber }) : t("goToPage", { page: pageNumber })}
      className={cn(
        "press-feedback group flex w-full flex-col items-center gap-1.5 rounded-lg p-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/50",
        // The page being read sits on a tinted tile, like the active item of a navigation list.
        isCurrent ? "bg-primary/10" : "hover:bg-sidebar-accent"
      )}
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-[3px] bg-card ring-1 transition-shadow duration-150",
          // Selected reads in vivid ink; the current page is marked by its tile and number instead.
          isSelected ? "ring-2 ring-selection" : "ring-border group-hover:ring-primary/40"
        )}
        style={{ width: THUMBNAIL_WIDTH }}
      >
        {src ? (
          // A data URL drawn in the browser from the loaded PDF; next/image has nothing to optimize.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="block h-auto w-full animate-in fade-in duration-200" />
        ) : (
          <span className="block aspect-[1/1.414] w-full" />
        )}
        {isSelected && (
          <>
            <span aria-hidden className="absolute inset-0 bg-selection/15" />
            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-selection text-selection-foreground shadow-sm animate-in zoom-in-75 duration-150">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
          </>
        )}
      </span>
      <span
        className={cn(
          "rounded-full px-1.5 font-mono text-[11px] tabular-nums",
          isCurrent ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
};
