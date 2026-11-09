"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { FeynmanAttempt, FeynmanIdea, FeynmanIdeaStatus } from "@/app/[locale]/document/[id]/hooks/useFeynman";
import type { FeynmanSession } from "@/app/[locale]/document/[id]/hooks/useFeynmanSession";
import { type FeynmanMark, markPhrases } from "@/app/[locale]/document/[id]/lib/feynman";
import { FeynmanCards } from "./FeynmanCards";
import { FeynmanProgress, FeynmanStatusIcon } from "./FeynmanProgress";

const SECTION_ORDER: FeynmanIdeaStatus[] = ["mastered", "missing", "confused"];

const MARK_CLASSES: Record<FeynmanMark, string> = {
  term: "underline decoration-ochre decoration-wavy underline-offset-[3px]",
  quote: "bg-warning/25",
};

const StudentText: React.FC<{ attempt: FeynmanAttempt }> = ({ attempt }) => {
  const { explanation, feedback } = attempt;
  const quotes = feedback.ideas.flatMap((idea) => (idea.quote ? [{ phrase: idea.quote, mark: "quote" as const }] : []));
  const terms = feedback.unexplainedTerms.map((phrase) => ({ phrase, mark: "term" as const }));

  return (
    <p className="whitespace-pre-line text-[13px]">
      {markPhrases(explanation, [...quotes, ...terms]).map((segment, index) =>
        segment.mark ? (
          <span key={index} className={MARK_CLASSES[segment.mark]}>
            {segment.text}
          </span>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </p>
  );
};

const IdeaFeedback: React.FC<{ idea: FeynmanIdea; onGoToPage: (page: number) => void }> = ({ idea, onGoToPage }) => {
  const t = useTranslations("feynman.result");
  return (
    <div>
      <p className="text-sm">
        {idea.quote && <span className="text-muted-foreground">{t("youSaid", { quote: idea.quote })} </span>}
        {idea.feedback}
      </p>
      {idea.status !== "mastered" && idea.page !== null && (
        <Button variant="link" size="sm" onClick={() => onGoToPage(idea.page as number)} className="h-auto px-0">
          {t("seeOnPage", { page: idea.page })}
        </Button>
      )}
    </div>
  );
};

interface FeynmanResultProps {
  session: FeynmanSession;
  documentId: string;
  onGoToPage: (page: number) => void;
}

export const FeynmanResult: React.FC<FeynmanResultProps> = ({ session, documentId, onGoToPage }) => {
  const t = useTranslations("feynman.result");
  const { attempts, subject } = session;
  const attempt = attempts.at(-1);
  if (!attempt || !subject) return null;
  const { feedback } = attempt;

  return (
    <div className="flex flex-col gap-[18px] px-5 pb-5">
      <section className="rounded-xl bg-muted p-3">
        <h3 className="mb-1 text-xs font-medium text-muted-foreground">{t("yourText")}</h3>
        <StudentText attempt={attempt} />
      </section>

      {SECTION_ORDER.map((status) => {
        const ideas = feedback.ideas.filter((idea) => idea.status === status);
        if (ideas.length === 0) return null;
        return (
          <section key={status} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <FeynmanStatusIcon status={status} className="size-3.5" />
              {t(`sections.${status}`)}
            </h3>
            {ideas.map((idea) => (
              <IdeaFeedback key={idea.idea} idea={idea} onGoToPage={onGoToPage} />
            ))}
          </section>
        );
      })}

      {feedback.unexplainedTerms.length > 0 && (
        <section className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[13px] text-muted-foreground">{t("unexplainedTerms")}</span>
          {feedback.unexplainedTerms.map((term) => (
            <span key={term} className="rounded-full bg-muted px-2.5 py-0.5 text-[13px]">
              {term}
            </span>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <p className="font-serif text-2xl italic leading-tight">{feedback.question ?? t("allMastered")}</p>
        <Button onClick={session.retry} disabled={session.isPreparing} className="self-start">
          {t("retry")}
        </Button>
      </section>

      <FeynmanCards documentId={documentId} pageNumber={subject.pageNumber} ideas={feedback.ideas} />

      {attempts.length > 1 && <FeynmanProgress attempts={attempts} />}
    </div>
  );
};
