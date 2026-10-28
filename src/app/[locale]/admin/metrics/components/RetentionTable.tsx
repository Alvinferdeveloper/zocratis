import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { RETENTION_WEEKS, type ProductMetrics } from "../hooks/useProductMetrics";

// From this share on, the cell is dark enough to need light text.
const DARK_CELL_FROM = 0.5;

export const RetentionTable: React.FC<{ cohorts: ProductMetrics["retention"] }> = ({ cohorts }) => {
  const t = useTranslations("admin.metrics.retention");
  const format = useFormatter();

  if (cohorts.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty", { weeks: RETENTION_WEEKS })}</p>;
  }

  const offsets = Array.from({ length: Math.max(...cohorts.map((cohort) => cohort.retained.length)) }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-max border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col" className="pr-4 font-medium">{t("cohort")}</th>
            <th scope="col" className="pr-4 text-right font-medium">{t("users")}</th>
            {offsets.map((n) => (
              <th key={n} scope="col" className="w-16 text-center font-medium">{t("week", { n })}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(({ cohortWeek, users, retained }) => (
            <tr key={cohortWeek}>
              <th scope="row" className="pr-4 text-left font-normal">
                {format.dateTime(new Date(`${cohortWeek}T00:00:00Z`), { day: "numeric", month: "short", timeZone: "UTC" })}
              </th>
              <td className="pr-4 text-right font-mono tabular-nums">{users}</td>
              {offsets.map((n) => {
                if (n > retained.length) return <td key={n} />;
                const share = users > 0 ? retained[n - 1] / users : 0;
                return (
                  <td
                    key={n}
                    title={`${retained[n - 1]}/${users}`}
                    className={cn(
                      "rounded-md py-1.5 text-center font-mono text-xs tabular-nums",
                      share >= DARK_CELL_FROM ? "text-primary-foreground" : "text-foreground"
                    )}
                    style={{ backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(share * 100)}%, var(--muted))` }}
                  >
                    {format.number(share, { style: "percent" })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
