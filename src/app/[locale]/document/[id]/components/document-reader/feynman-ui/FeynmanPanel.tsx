"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import type { FeynmanSession } from "@/app/[locale]/document/[id]/hooks/useFeynmanSession";
import { masteredCount } from "@/app/[locale]/document/[id]/lib/feynman";
import { FeynmanComposer } from "./FeynmanComposer";
import { FeynmanHome } from "./FeynmanHome";
import { FeynmanResult } from "./FeynmanResult";
import { useSubjectLabel } from "./useSubjectLabel";

interface FeynmanPanelProps {
  session: FeynmanSession;
  documentId: string;
  currentPage: number;
  numPages: number | null;
  onGoToPage: (page: number) => void;
}

// The reader's side panel for explaining something in your own words. It only leaves on purpose, so a draft is never lost to a stray click.
export const FeynmanPanel: React.FC<FeynmanPanelProps> = ({ session, documentId, currentPage, numPages, onGoToPage }) => {
  const t = useTranslations("feynman");
  const tActions = useTranslations("common.actions");
  const subjectLabel = useSubjectLabel();
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  const leave = (action: () => void) => {
    if (session.hasDraft) setPendingLeave(() => action);
    else action();
  };

  const { view, subject, attempts } = session;
  const latest = attempts.at(-1);
  const attemptNumber = view === "writing" ? attempts.length + 1 : attempts.length;

  return (
    <section aria-label={t("ariaLabel")} className="flex h-full flex-col bg-card">
      <header className="flex min-h-12 shrink-0 items-center gap-1 pl-3 pr-2">
        {view !== "home" && (
          <IconButton size="icon-sm" label={t("back")} onClick={() => leave(session.openHome)} className="shrink-0">
            <ArrowLeft className="size-3.5" />
          </IconButton>
        )}
        <p className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground">
          {view !== "home" && subject && t("trail", { subject: subjectLabel(subject), number: attemptNumber })}
        </p>
        {view === "result" && latest && (
          <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums">
            {t("score", { mastered: masteredCount(latest.feedback), total: latest.feedback.ideas.length })}
          </span>
        )}
        <IconButton size="icon-sm" label={tActions("close")} onClick={() => leave(session.close)} className="shrink-0">
          <X className="size-3.5" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" aria-live="polite">
        {view === "home" && <FeynmanHome session={session} currentPage={currentPage} numPages={numPages} />}
        {view === "writing" && <FeynmanComposer session={session} onCancel={() => leave(session.openHome)} />}
        {view === "result" && <FeynmanResult session={session} documentId={documentId} onGoToPage={onGoToPage} />}
      </div>

      <ConfirmDialog
        isOpen={pendingLeave !== null}
        onOpenChange={(open) => !open && setPendingLeave(null)}
        onConfirm={() => pendingLeave?.()}
        title={t("leave.title")}
        description={t("leave.description")}
        confirmText={t("leave.confirm")}
      />
    </section>
  );
};
