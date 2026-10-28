"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { getApiErrorKey } from "@/lib/api-errors";
import { RETENTION_WEEKS, type ProductMetrics, useProductMetrics } from "../hooks/useProductMetrics";
import { FigureList } from "./FigureList";
import { MetricSection } from "./MetricSection";
import { RetentionTable } from "./RetentionTable";
import { StudyCycle } from "./StudyCycle";

const SECTION_PLACEHOLDERS = 3;

const MetricsContent: React.FC<{ metrics: ProductMetrics }> = ({ metrics }) => {
  const t = useTranslations("admin.metrics");
  const format = useFormatter();
  const { thisWeek, period } = metrics;

  const percent = (value: number | null) => (value === null ? "—" : format.number(value, { style: "percent" }));
  const decimal = (value: number | null) =>
    value === null ? "—" : format.number(value, { maximumFractionDigits: 1 });
  const periodStart = format.dateTime(new Date(`${metrics.periodStart}T00:00:00Z`), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="flex flex-col gap-3">
        <FigureList
          figures={[
            { label: t("summary.activeUsers"), value: String(thisWeek.activeUsers) },
            { label: t("summary.newUsers"), value: String(thisWeek.newUsers) },
            { label: t("summary.explanationsPerActiveDay"), value: decimal(period.explanationsPerActiveDay) },
            { label: t("summary.reviewAccuracy"), value: percent(period.reviewAccuracy) },
            { label: t("summary.examAccuracy"), value: percent(period.examAccuracy) },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          {t("summary.periodNote", { weeks: RETENTION_WEEKS, start: periodStart })}
        </p>
      </div>

      <MetricSection title={t("retention.title")} hint={t("retention.hint")}>
        <RetentionTable cohorts={metrics.retention} />
      </MetricSection>

      <MetricSection title={t("cycle.title")} hint={t("cycle.hint")}>
        <StudyCycle cycle={thisWeek.studyCycle} />
      </MetricSection>

      <MetricSection title={t("aiCards.title")} hint={t("aiCards.hint", { weeks: RETENTION_WEEKS })}>
        <FigureList
          figures={[
            { label: t("aiCards.proposed"), value: String(period.aiCards.proposed) },
            { label: t("aiCards.kept"), value: String(period.aiCards.kept) },
            { label: t("aiCards.edited"), value: String(period.aiCards.edited) },
          ]}
        />
      </MetricSection>
    </>
  );
};

// Internal page: reachable by URL only, and the API answers 403 to anyone not in ADMIN_EMAILS.
export const MetricsDashboard: React.FC = () => {
  const t = useTranslations("admin.metrics");
  const { data, error, isLoading, refetch } = useProductMetrics();

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: SECTION_PLACEHOLDERS }, (_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />);
    }
    if (error) {
      const isForbidden = getApiErrorKey(error) === "forbidden";
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t(isForbidden ? "forbidden" : "error")}</p>
          {!isForbidden && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          )}
        </div>
      );
    }
    return data && <MetricsContent metrics={data} />;
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="px-6 py-6 sm:px-10">
        <Link href={ROUTES.workspace} className="text-foreground">
          <BrandLogo />
        </Link>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 sm:px-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
        </div>
        {renderBody()}
      </main>
    </div>
  );
};
