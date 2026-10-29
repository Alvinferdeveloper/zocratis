"use client";

import { useState } from "react";
import { Check, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showApiErrorToast } from "@/components/api-error-toast";
import { trackEvent } from "@/lib/product-events";
import type { Explanation } from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { useCreateFlashcard } from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";

type Step = "offered" | "answering" | "revealed" | "passed" | "failed";

interface ComprehensionCheckProps {
  documentId: string;
  pageNumber: number;
  check: NonNullable<Explanation["check"]>;
}

// Optional: the student answers in their own words, compares with the expected answer and grades
// themselves. A miss becomes a card linked to the page, so it comes back in review.
export const ComprehensionCheck: React.FC<ComprehensionCheckProps> = ({ documentId, pageNumber, check }) => {
  const t = useTranslations("reader.explain.check");
  const createCard = useCreateFlashcard(documentId);
  const [step, setStep] = useState<Step>("offered");
  const [answer, setAnswer] = useState("");

  const grade = (passed: boolean) => {
    trackEvent("comprehension_checked", { passed });
    if (passed) {
      setStep("passed");
      return;
    }
    createCard.mutate(
      { front: check.question, back: check.answer, pageNumber, source: "check" },
      { onSuccess: () => setStep("failed"), onError: showApiErrorToast }
    );
  };

  if (step === "offered") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
        <p className="text-sm text-muted-foreground">{t("offer")}</p>
        <Button variant="ghost" size="sm" onClick={() => setStep("answering")}>
          {t("start")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <p className="text-sm font-medium leading-snug">{check.question}</p>

      {step === "answering" ? (
        <>
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("yourAnswer")}
            rows={3}
            autoFocus
          />
          <Button variant="outline" size="sm" onClick={() => setStep("revealed")} className="self-end">
            {t("reveal")}
          </Button>
        </>
      ) : (
        <>
          {answer.trim() && (
            <div>
              <p className="text-xs text-muted-foreground">{t("yourAnswer")}</p>
              <p className="mt-0.5 whitespace-pre-line text-sm">{answer.trim()}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">{t("expected")}</p>
            <p className="mt-0.5 text-sm">{check.answer}</p>
          </div>

          {step === "revealed" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-auto text-sm text-muted-foreground">{t("question")}</span>
              <Button variant="outline" size="sm" onClick={() => grade(true)} disabled={createCard.isPending}>
                {t("passed")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => grade(false)} disabled={createCard.isPending}>
                {t("failed")}
              </Button>
            </div>
          )}
          {step === "passed" && (
            <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-4" />
              {t("passedDone")}
            </p>
          )}
          {step === "failed" && (
            <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Layers className="size-4" />
              {t("failedDone")}
            </p>
          )}
        </>
      )}
    </div>
  );
};
