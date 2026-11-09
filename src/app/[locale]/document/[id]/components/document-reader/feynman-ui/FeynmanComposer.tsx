"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApiErrorText } from "@/components/api-error-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorKey } from "@/lib/api-errors";
import type { FeynmanSession } from "@/app/[locale]/document/[id]/hooks/useFeynmanSession";
import { FEYNMAN_MAX_EXPLANATION, FEYNMAN_MIN_EXPLANATION } from "@/app/[locale]/document/[id]/lib/feynman";
import { FeynmanProgress } from "./FeynmanProgress";

interface FeynmanComposerProps {
  session: FeynmanSession;
  onCancel: () => void;
}

export const FeynmanComposer: React.FC<FeynmanComposerProps> = ({ session, onCancel }) => {
  const t = useTranslations("feynman.composer");
  const tActions = useTranslations("common.actions");
  const { attempts, draft, isSubmitting, submitError } = session;
  const question = attempts.at(-1)?.feedback.question;
  const canSubmit = draft.trim().length >= FEYNMAN_MIN_EXPLANATION && !isSubmitting;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && canSubmit) session.submit();
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      <h2 className={question ? "font-serif text-2xl italic leading-tight" : "font-serif text-3xl italic leading-tight"}>
        {question ?? t("title")}
      </h2>

      <Field id="feynman-explanation" label={t("label")} hint={t("hint")}>
        <Textarea
          value={draft}
          onChange={(event) => session.setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attempts.length > 0 ? t("placeholderRetry") : undefined}
          maxLength={FEYNMAN_MAX_EXPLANATION}
          readOnly={isSubmitting}
          rows={attempts.length > 0 ? 7 : 11}
          autoFocus
        />
      </Field>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          <ApiErrorText errorKey={getApiErrorKey(submitError)} />
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {tActions("cancel")}
        </Button>
        <Button onClick={session.submit} disabled={!canSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {t(isSubmitting ? "submitting" : "submit")}
        </Button>
      </div>

      {attempts.length > 0 && (
        <div className="border-t border-border pt-4">
          <FeynmanProgress attempts={attempts} />
        </div>
      )}
    </div>
  );
};
