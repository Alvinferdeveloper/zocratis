import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductMetrics } from "../hooks/useProductMetrics";

const STEPS = ["read", "asked", "saved", "reviewed"] as const;

export const StudyCycle: React.FC<{ cycle: ProductMetrics["thisWeek"]["studyCycle"] }> = ({ cycle }) => {
  const t = useTranslations("admin.metrics.cycle");

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          {index > 0 && <ChevronRight aria-hidden className="size-4 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">{t(step)}</span>
          <span className="font-mono text-lg font-semibold tabular-nums">{cycle[step]}</span>
        </li>
      ))}
    </ol>
  );
};
