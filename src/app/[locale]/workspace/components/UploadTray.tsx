import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Progress } from "@/components/ui/progress";
import type { UploadItem } from "@/app/[locale]/workspace/hooks/useDocumentUpload";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const UploadStatusIcon: React.FC<{ item: UploadItem }> = ({ item }) => {
  const t = useTranslations("workspace.upload");
  if (item.status === "done") return <CircleCheck aria-label={t("done")} className="size-4 shrink-0 text-success" />;
  if (item.status === "failed") return <CircleAlert aria-label={t("failed")} className="size-4 shrink-0 text-destructive" />;
  return (
    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
      {t("percent", { ratio: item.progress })}
    </span>
  );
};

// Uploads in progress, in the corner where they don't cover the documents.
export const UploadTray: React.FC<{ uploads: UploadItem[]; onDismiss: () => void }> = ({ uploads, onDismiss }) => {
  const t = useTranslations("workspace.upload");
  const reduceMotion = useReducedMotion();
  const pending = uploads.filter((item) => item.status === "uploading").length;
  const offset = reduceMotion ? 0 : 8;

  return (
    <AnimatePresence>
      {uploads.length > 0 && (
        <motion.section
          aria-label={t("title")}
          initial={{ opacity: 0, transform: `translateY(${offset}px)` }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{ opacity: 0, transform: `translateY(${offset / 2}px)` }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card p-3 shadow-float"
        >
          <header className="flex items-center justify-between gap-2 pb-2 pl-1">
            <p className="text-sm font-medium" aria-live="polite">
              {pending > 0 ? t("uploading", { count: pending }) : t("finished")}
            </p>
            {pending === 0 && (
              <IconButton size="icon-sm" label={t("dismiss")} onClick={onDismiss}>
                <X className="size-3.5" />
              </IconButton>
            )}
          </header>

          <ul className="max-h-60 space-y-1 overflow-y-auto scrollbar-thin">
            {uploads.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                <PaperSheet size="sm" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-sm text-foreground">{item.name}</p>
                  {item.status === "uploading" && <Progress value={item.progress * 100} className="h-1" />}
                  {item.status === "failed" && <p className="text-xs text-destructive">{t("failed")}</p>}
                </div>
                <UploadStatusIcon item={item} />
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </AnimatePresence>
  );
};
