"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUp, Check, Layers, MessageSquare, RefreshCw, StickyNote, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorText } from "@/components/api-error-message";
import { showApiErrorToast } from "@/components/api-error-toast";
import { getApiErrorKey } from "@/lib/api-errors";
import {
  type ExplainSubject,
  MAX_EXPLAIN_LEVEL,
  useExplanation,
} from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { useCreateFlashcard } from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";
import { useFollowUpConversation } from "@/app/[locale]/document/[id]/hooks/useFollowUpConversation";
import { FlashcardForm } from "@/app/[locale]/document/[id]/components/flashcards/components/FlashcardForm";
import { FLASHCARD_BACK_MAX_LENGTH } from "@/app/[locale]/document/[id]/components/flashcards/lib/flashcard-limits";
import { explanationToMarkdown, toExcerpt } from "@/app/[locale]/document/[id]/lib/explanation";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import { ComprehensionCheck } from "./ComprehensionCheck";

// What the chat gets when the student asks more about an explanation.
export interface ExplanationFollowUp {
  question: string;
  // The explanation it comes from, so a later visit can open the conversation again.
  subjectId: string;
  // Shown as the quoted context of the question: the passage, or the region's label.
  quote: string;
  pageNumber: number;
  image?: string;
  region?: PageRegion;
  explanation: string;
}

export interface ExplainPanelProps {
  documentId: string;
  subject: ExplainSubject;
  onClose: () => void;
  // The title is what heads the note: the passage, or the region's label.
  onSaveNote: (markdown: string, title: string) => Promise<unknown>;
  // A question about it starts a new chat conversation, where it can go as deep as needed.
  onAskMore: (followUp: ExplanationFollowUp) => void;
  onOpenConversation: (conversationId: string) => void;
  onGoToPage: (page: number) => void;
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
  onGoToPage,
}) => {
  const t = useTranslations("reader.explain");
  const tActions = useTranslations("common.actions");
  const tCards = useTranslations("flashcards");
  const explain = useExplanation(documentId, subject);
  const createCard = useCreateFlashcard(documentId);
  const { data: followUpConversation } = useFollowUpConversation(documentId, subject.id);
  const { explanation, term, level } = explain;
  const [savedViews, setSavedViews] = useState<Set<string>>(new Set());
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const viewKey = `${term ?? ""}#${level}`;
  const isSaved = savedViews.has(viewKey);
  const isRegion = Boolean(subject.image);
  const regionKind = subject.regionKind ?? "crop";
  const subjectLabel = isRegion
    ? t("regionLabel", { kind: regionKind, page: subject.pageNumber })
    : `«${toExcerpt(subject.text)}»`;
  const trail = [subjectLabel, ...explain.trail].join(" › ");

  const saveNote = async () => {
    if (!explanation) return;
    setIsSavingNote(true);
    try {
      await onSaveNote(explanationToMarkdown(explanation, term), isRegion ? subjectLabel : subject.text);
      setSavedViews((current) => new Set(current).add(viewKey));
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const cardFront = term
    ? t("cardFrontTerm", { term })
    : isRegion
      ? t("cardFrontRegion", { kind: regionKind, page: subject.pageNumber })
      : t("cardFrontPassage", { excerpt: toExcerpt(subject.text) });

  const saveCard = async (card: { front: string; back: string }) => {
    await createCard.mutateAsync({ ...card, pageNumber: subject.pageNumber });
    toast.success(tCards("selection.saved"));
    setIsCardOpen(false);
  };

  const askMore = (event: React.FormEvent) => {
    event.preventDefault();
    if (!explanation || !question.trim()) return;
    onAskMore({
      question: question.trim(),
      subjectId: subject.id,
      quote: isRegion ? subjectLabel : subject.text,
      pageNumber: subject.pageNumber,
      image: subject.image,
      region: subject.region,
      explanation: explanationToMarkdown(explanation, term),
    });
  };

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
                  <FlashcardForm
                    initial={{ front: cardFront, back: explanation.coreIdea.slice(0, FLASHCARD_BACK_MAX_LENGTH) }}
                    submitLabel={tCards("form.save")}
                    onSubmit={saveCard}
                    onCancel={() => setIsCardOpen(false)}
                    isPending={createCard.isPending}
                    error={createCard.error}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
        <div className="flex flex-wrap items-center gap-1">
          {level < MAX_EXPLAIN_LEVEL && (
            <Button variant="outline" size="sm" onClick={explain.simplify} disabled={!explanation || explain.isLoading}>
              {t("simplify")}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={explain.thinkAgain} disabled={!explanation || explain.isLoading}>
            <RefreshCw />
            {t("thinkAgain")}
          </Button>
          <Button variant="ghost" size="sm" onClick={saveNote} disabled={!explanation || isSaved || isSavingNote}>
            {isSaved ? <Check /> : <StickyNote />}
            {t(isSaved ? "noteSaved" : "saveNote")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsCardOpen(true)} disabled={!explanation || isCardOpen}>
            <Layers />
            {t("card")}
          </Button>
        </div>
        {followUpConversation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenConversation(followUpConversation.id)}
            className="min-w-0 justify-start"
          >
            <MessageSquare />
            <span className="truncate">{t("openConversation", { title: followUpConversation.title })}</span>
          </Button>
        )}
        <form onSubmit={askMore} className="flex items-center gap-1.5">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("askMore")}
            aria-label={t("askMore")}
            disabled={!explanation}
            className="h-8 text-sm md:text-sm"
          />
          <IconButton type="submit" size="icon" variant="default" label={t("askMoreSend")} disabled={!explanation || !question.trim()}>
            <ArrowUp />
          </IconButton>
        </form>
      </footer>
    </section>
  );
};
