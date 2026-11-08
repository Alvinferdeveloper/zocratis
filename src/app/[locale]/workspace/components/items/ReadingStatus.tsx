import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { ReadingProgress } from "@/app/[locale]/workspace/lib/reading-progress";
import { ReadingProgressBar } from "@/app/[locale]/workspace/components/ReadingProgressBar";

// How far the user has read a document: not started, a bar with its percent, or finished.
export const ReadingStatus: React.FC<{ progress: ReadingProgress | null }> = ({ progress }) => {
  const t = useTranslations("workspace.progress");

  if (!progress) return <span className="text-xs text-muted-foreground">{t("notStarted")}</span>;

  if (progress.ratio >= 1) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check aria-hidden className="size-3.5 text-success" />
        {t("finished")}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <ReadingProgressBar ratio={progress.ratio} className="w-14" />
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{t("percent", { ratio: progress.ratio })}</span>
    </span>
  );
};
