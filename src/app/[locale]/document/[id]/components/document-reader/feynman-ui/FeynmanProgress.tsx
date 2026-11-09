"use client";

import { Check, CircleDashed, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeynmanAttempt, FeynmanIdeaStatus } from "@/app/[locale]/document/[id]/hooks/useFeynman";
import { masteredCount } from "@/app/[locale]/document/[id]/lib/feynman";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<FeynmanIdeaStatus, { icon: React.ElementType; className: string }> = {
  mastered: { icon: Check, className: "text-success" },
  missing: { icon: CircleDashed, className: "text-muted-foreground" },
  // Plain warning falls short of 3:1 on ivory; same mix as the syntax colors.
  confused: { icon: TriangleAlert, className: "text-[color-mix(in_oklch,var(--warning)_65%,var(--foreground))]" },
};

export const FeynmanStatusIcon: React.FC<{ status: FeynmanIdeaStatus; className?: string }> = ({ status, className }) => {
  const { icon: Icon, className: color } = STATUS_ICONS[status];
  return <Icon aria-hidden className={cn("shrink-0", color, className)} />;
};

// Columns kept so the table fits the panel; older attempts stay in the first-to-last score.
const MAX_ATTEMPT_COLUMNS = 5;

// The ideas are fixed on the first attempt, so each row compares the same thing across attempts.
export const FeynmanProgress: React.FC<{ attempts: FeynmanAttempt[] }> = ({ attempts }) => {
  const t = useTranslations("feynman.progress");
  const firstShown = Math.max(0, attempts.length - MAX_ATTEMPT_COLUMNS);
  const shown = attempts.slice(firstShown);
  const peeked = attempts.flatMap((attempt, index) => (attempt.peeked ? [index + 1] : []));

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{t("title")}</h3>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="py-1 text-left font-medium">
              {t("idea")}
            </th>
            {shown.map((attempt, index) => (
              <th key={attempt.id} scope="col" className="w-9 font-mono font-medium">
                {firstShown + index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attempts[0].feedback.ideas.map((idea, ideaIndex) => (
            <tr key={idea.idea} className="border-t border-border">
              <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                {idea.idea}
              </th>
              {shown.map((attempt) => {
                const status = attempt.feedback.ideas[ideaIndex].status;
                return (
                  <td key={attempt.id} className="text-center">
                    <FeynmanStatusIcon status={status} className="mx-auto size-3.5" />
                    <span className="sr-only">{t(`status.${status}`)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="py-1.5 text-muted-foreground">{t("total")}</td>
            {shown.map((attempt) => (
              <td key={attempt.id} className="text-center font-mono font-semibold tabular-nums">
                {masteredCount(attempt.feedback)}/{attempt.feedback.ideas.length}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      {peeked.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("peeked", { count: peeked.length, attempts: peeked.join(", ") })}</p>
      )}
    </section>
  );
};
