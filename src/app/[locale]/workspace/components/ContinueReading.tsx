import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import type { Document } from "@/app/types";
import { getReadingProgress } from "@/app/[locale]/workspace/lib/reading-progress";
import { ReadingProgressBar } from "@/app/[locale]/workspace/components/ReadingProgressBar";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";

// One click from the workspace back to the page the user was reading.
export const ContinueReading: React.FC<{ document: Document }> = ({ document }) => {
  const t = useTranslations("workspace.progress");
  const progress = getReadingProgress(document);
  if (!progress) return null;

  return (
    <Link
      href={ROUTES.document(document.id)}
      className="group -mx-3 mb-8 flex items-center gap-5 rounded-2xl p-3 outline-none transition-colors duration-150 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <PaperSheet
        page={progress.lastPage}
        bookmarked
        className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-0.5 motion-reduce:transform-none"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{t("leftOff", { page: progress.lastPage })}</p>
        <p className="truncate font-serif text-2xl italic leading-tight">{document.fileName}</p>
        <div className="mt-2.5 flex items-center gap-3">
          <ReadingProgressBar ratio={progress.ratio} className="h-0.5 max-w-sm flex-1" />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {t("remaining", { ratio: progress.ratio, count: progress.pageCount - progress.furthestPage })}
          </span>
        </div>
      </div>

      <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary sm:flex">
        {t("continueAction")}
        <ArrowRight className="size-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5 motion-reduce:transform-none" />
      </span>
    </Link>
  );
};
