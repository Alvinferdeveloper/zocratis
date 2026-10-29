"use client";

import { useState } from "react";
import { ArrowLeft, Check, Layers, MessageSquare, StickyNote, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorText } from "@/components/api-error-message";
import { showApiErrorToast } from "@/components/api-error-toast";
import { getApiErrorKey } from "@/lib/api-errors";
import {
  type ExplainSubject,
  MAX_EXPLAIN_LEVEL,
  useExplanation,
} from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { explanationToMarkdown, toExcerpt } from "@/app/[locale]/document/[id]/lib/explanation";

export interface ExplainPanelProps {
  documentId: string;
  subject: ExplainSubject;
  onClose: () => void;
  onSaveNote: (markdown: string) => Promise<unknown>;
  onCreateCard: (card: { front: string; back: string }) => void;
  onContinueInChat: () => void;
  onGoToPage: (page: number) => void;
}

// One selection's explanation: the passage first, then any term opened from it, each with its levels.
export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  documentId,
  subject,
  onClose,
  onSaveNote,
  onCreateCard,
  onContinueInChat,
  onGoToPage,
}) => {
  const t = useTranslations("reader.explain");
  const tActions = useTranslations("common.actions");
  const explain = useExplanation(documentId, subject);
  const { explanation, term, level } = explain;
  const [savedViews, setSavedViews] = useState<Set<string>>(new Set());
  const [isSavingNote, setIsSavingNote] = useState(false);

  const viewKey = `${term ?? ""}#${level}`;
  const isSaved = savedViews.has(viewKey);

  const saveNote = async () => {
    if (!explanation) return;
    setIsSavingNote(true);
    try {
      await onSaveNote(explanationToMarkdown(explanation, term));
      setSavedViews((current) => new Set(current).add(viewKey));
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const createCard = () => {
    if (!explanation) return;
    const front = term ? t("cardFrontTerm", { term }) : t("cardFrontPassage", { excerpt: toExcerpt(subject.text) });
    onCreateCard({ front, back: explanation.coreIdea });
  };

  const trail = [`«${toExcerpt(subject.text)}»`, ...explain.trail].join(" › ");

  return (
    <div className="flex flex-col">
      <div className="flex min-h-11 items-center gap-1 pl-3 pr-2 pt-2">
        {term && (
          <Button variant="ghost" size="sm" onClick={explain.back} className="-ml-1 shrink-0">
            <ArrowLeft />
            {t("back")}
          </Button>
        )}
        <p className={cn("min-w-0 flex-1 truncate text-xs text-muted-foreground", !term && "pl-2")}>{trail}</p>
        <IconButton size="icon-sm" label={tActions("close")} onClick={onClose} className="shrink-0">
          <X className="size-3.5" />
        </IconButton>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-2" aria-live="polite" aria-busy={explain.isLoading}>
        {term && <h3 className="font-serif text-3xl italic leading-tight">{term}</h3>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("coreIdea")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("level", { level })}
            <span className="flex gap-0.5" aria-hidden>
              {Array.from({ length: MAX_EXPLAIN_LEVEL }, (_, index) => (
                <span
                  key={index}
                  className={cn("size-1.5 rounded-full", index < level ? "bg-primary" : "bg-border")}
                />
              ))}
            </span>
          </span>
        </div>

        {explain.isLoading ? (
          <div className="flex flex-col gap-2 py-1">
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : explain.error ? (
          <div className="flex flex-col items-start gap-2 py-1">
            <p role="alert" className="text-sm text-destructive">
              <ApiErrorText errorKey={getApiErrorKey(explain.error)} />
            </p>
            <Button variant="outline" size="sm" onClick={explain.retry}>
              {t("retry")}
            </Button>
          </div>
        ) : (
          explanation && (
            <>
              <p className="text-base font-semibold leading-snug tracking-tight">{explanation.coreIdea}</p>
              <p className="text-sm leading-relaxed text-foreground/85">{explanation.explanation}</p>

              {explanation.keyTerms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="mr-0.5 text-xs text-muted-foreground">{t("keyTerms")}</span>
                  {explanation.keyTerms.map((keyTerm) => (
                    <button
                      key={keyTerm}
                      type="button"
                      onClick={() => explain.openTerm(keyTerm)}
                      className="press-feedback h-7 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      {keyTerm}
                    </button>
                  ))}
                </div>
              )}

              {explanation.definedOnPage !== null && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => onGoToPage(explanation.definedOnPage as number)}
                  className="h-auto self-start px-0"
                >
                  {t("definedOn", { page: explanation.definedOnPage })}
                </Button>
              )}
            </>
          )
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border p-3">
        {level < MAX_EXPLAIN_LEVEL ? (
          <Button variant="outline" size="sm" onClick={explain.simplify} disabled={!explanation}>
            {t("simplify")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onContinueInChat}>
            <MessageSquare />
            {t("continueInChat")}
          </Button>
        )}
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={saveNote} disabled={!explanation || isSaved || isSavingNote}>
          {isSaved ? <Check /> : <StickyNote />}
          {t(isSaved ? "noteSaved" : "saveNote")}
        </Button>
        <Button variant="ghost" size="sm" onClick={createCard} disabled={!explanation}>
          <Layers />
          {t("card")}
        </Button>
      </div>
    </div>
  );
};
