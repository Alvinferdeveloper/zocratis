"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { FeynmanSession } from "@/app/[locale]/document/[id]/hooks/useFeynmanSession";
import {
  FEYNMAN_MAX_PAGES,
  groupAttemptsBySubject,
  masteredCount,
  pagesSubject,
} from "@/app/[locale]/document/[id]/lib/feynman";
import { useSubjectLabel } from "./useSubjectLabel";

interface FeynmanHomeProps {
  session: FeynmanSession;
  currentPage: number;
  numPages: number | null;
}

// The starting point from the reader's toolbar: teach these pages, or go back to an earlier subject.
export const FeynmanHome: React.FC<FeynmanHomeProps> = ({ session, currentPage, numPages }) => {
  const t = useTranslations("feynman.home");
  const subjectLabel = useSubjectLabel();
  const [pageToInput, setPageToInput] = useState("");

  const from = currentPage || 1;
  const pageTo = pageToInput.trim() ? Number(pageToInput) : from;
  const lastAllowed = Math.min(from + FEYNMAN_MAX_PAGES - 1, numPages ?? from + FEYNMAN_MAX_PAGES - 1);
  const isRangeValid = Number.isInteger(pageTo) && pageTo >= from && pageTo <= lastAllowed;
  const histories = groupAttemptsBySubject(session.allAttempts);

  return (
    <div className="flex flex-col gap-5 px-5 pb-5">
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">{t("page", { page: from })}</p>
        <Field
          id="feynman-page-to"
          label={t("pageTo")}
          hint={t("pageToHint", { max: FEYNMAN_MAX_PAGES })}
          error={isRangeValid ? undefined : t("pageToInvalid", { from, to: lastAllowed })}
        >
          <Input
            value={pageToInput}
            onChange={(event) => setPageToInput(event.target.value)}
            placeholder={String(from)}
            inputMode="numeric"
            className="w-20 font-mono tabular-nums"
          />
        </Field>
        {session.sourceProblem && (
          <p role="alert" className="text-sm text-destructive">
            {t(`sourceProblem.${session.sourceProblem}`)}
          </p>
        )}
        <Button
          size="sm"
          onClick={() => session.teach(pagesSubject(from, pageTo))}
          disabled={!isRangeValid || session.isPreparing}
          className="self-start"
        >
          {t("start")}
        </Button>
      </section>

      {histories.length > 0 && (
        <section className="flex flex-col gap-0.5">
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{t("history")}</h3>
          {histories.map((history) => {
            const first = history.attempts[0].feedback;
            const last = history.attempts[history.attempts.length - 1].feedback;
            return (
              <button
                key={history.subject.id}
                type="button"
                onClick={() => session.openHistory(history)}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] p-2 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{subjectLabel(history.subject)}</span>
                  <span className="text-xs text-muted-foreground">{t("attempts", { count: history.attempts.length })}</span>
                </span>
                <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums">
                  {history.attempts.length > 1
                    ? t("scoreProgress", { first: masteredCount(first), last: masteredCount(last), total: last.ideas.length })
                    : t("score", { mastered: masteredCount(last), total: last.ideas.length })}
                </span>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
};
