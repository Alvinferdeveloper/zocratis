"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sigma, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorText } from "@/components/api-error-message";
import { getApiErrorKey } from "@/lib/api-errors";
import {
  type ExplainSubject,
  MAX_EXPLAIN_LEVEL,
  useExplanation,
} from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { explanationToMarkdown, toExcerpt } from "@/app/[locale]/document/[id]/lib/explanation";
import { ComprehensionCheck } from "./ComprehensionCheck";
import { ExplainActions, type ExplainHandlers } from "./ExplainActions";
import { ExplainCardForm } from "./ExplainCardForm";

export interface ExplainPanelProps extends ExplainHandlers {
  documentId: string;
  subject: ExplainSubject;
  onClose: () => void;
  // Fired once the passage or region itself has an explanation (not a term), to keep it on the page.
  onExplained: () => void;
  onGoToPage: (page: number) => void;
  // Set when this can be read as a formula, layer by layer.
  onViewLayers?: () => void;
}

// One selection's explanation in the floating card: the passage or region first, then any term
// opened from it, each with its levels. The body scrolls, so the card never outgrows the screen.
export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  documentId,
  subject,
  onClose,
  onSaveNote,
  onAskMore,
  onOpenConversation,
  onExplained,
  noteAction,
  onGoToPage,
  onViewLayers,
}) => {
  const t = useTranslations("reader.explain");
  const tFormula = useTranslations("reader.formula");
  const tActions = useTranslations("common.actions");
  const explain = useExplanation(documentId, subject);
  const { explanation, term, level } = explain;
  const [isCardOpen, setIsCardOpen] = useState(false);

  const hasReportedExplanation = useRef(false);
  useEffect(() => {
    if (!explanation || term || hasReportedExplanation.current) return;
    hasReportedExplanation.current = true;
    onExplained();
  }, [explanation, term, onExplained]);

  const viewKey = `${term ?? ""}#${level}`;
  const isRegion = Boolean(subject.image);
  const regionKind = subject.regionKind ?? "crop";
  const subjectLabel = isRegion
    ? t("regionLabel", { kind: regionKind, page: subject.pageNumber })
    : `«${toExcerpt(subject.text)}»`;
  const trail = [subjectLabel, ...explain.trail].join(" › ");

  const cardFront = term
    ? t("cardFrontTerm", { term })
    : isRegion
      ? t("cardFrontRegion", { kind: regionKind, page: subject.pageNumber })
      : t("cardFrontPassage", { excerpt: toExcerpt(subject.text) });

  return (
    <section className="flex max-h-[min(34rem,var(--radix-popover-content-available-height))] flex-col">
      <header className="flex min-h-11 shrink-0 items-center gap-1 pl-3 pr-2 pt-1">
        {term && (
          <Button variant="ghost" size="sm" onClick={explain.back} className="-ml-1 shrink-0">
            <ArrowLeft />
            {t("back")}
          </Button>
        )}
        <p className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground">{trail}</p>
        <IconButton size="icon-sm" label={tActions("close")} onClick={onClose} className="shrink-0">
          <X className="size-3.5" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" aria-live="polite" aria-busy={explain.isLoading}>
        <div className="flex flex-col gap-3 px-5 pb-4 pt-1">
          {term && (
            <div>
              <h3 className="font-serif text-3xl italic leading-tight">{term}</h3>
              {explanation?.termTranslation && (
                <p className="mt-0.5 text-sm text-muted-foreground">{explanation.termTranslation}</p>
              )}
            </div>
          )}

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
                    className={index < level ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-border"}
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
                        key={keyTerm.original}
                        type="button"
                        onClick={() => explain.openTerm(keyTerm)}
                        className="press-feedback h-7 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      >
                        {keyTerm.original}
                        {keyTerm.translation && (
                          <span className="ml-1 font-normal text-primary/70">· {keyTerm.translation}</span>
                        )}
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

                {explanation.check && (
                  // Each term and level has its own question, started fresh.
                  <ComprehensionCheck
                    key={viewKey}
                    documentId={documentId}
                    pageNumber={subject.pageNumber}
                    check={explanation.check}
                  />
                )}

                {isCardOpen && (
                  <ExplainCardForm
                    documentId={documentId}
                    pageNumber={subject.pageNumber}
                    front={cardFront}
                    back={explanation.coreIdea}
                    onClose={() => setIsCardOpen(false)}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>

      <ExplainActions
        documentId={documentId}
        subject={subject}
        markdown={explanation && explanationToMarkdown(explanation, term)}
        viewKey={viewKey}
        title={isRegion ? subjectLabel : subject.text}
        isBusy={explain.isLoading}
        isCardOpen={isCardOpen}
        onThinkAgain={explain.thinkAgain}
        onOpenCard={() => setIsCardOpen(true)}
        onSaveNote={onSaveNote}
        onAskMore={onAskMore}
        onOpenConversation={onOpenConversation}
        noteAction={noteAction}
      >
        {level < MAX_EXPLAIN_LEVEL && (
          <Button variant="outline" size="sm" onClick={explain.simplify} disabled={!explanation || explain.isLoading}>
            {t("simplify")}
          </Button>
        )}
        {onViewLayers && !term && (
          <Button variant="ghost" size="sm" onClick={onViewLayers}>
            <Sigma />
            {tFormula("viewLayers")}
          </Button>
        )}
      </ExplainActions>
    </section>
  );
};
