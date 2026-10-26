"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { StatusPage } from "./StatusPage";

export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export const UnexpectedErrorPage: React.FC<ErrorBoundaryProps> = ({ error, reset }) => {
  const t = useTranslations("common.statusPage");

  return (
    <StatusPage
      eyebrow={t("unexpected.eyebrow")}
      title={t("unexpected.title")}
      description={t("unexpected.description")}
      actions={
        <>
          <Button onClick={reset}>
            <RotateCcw />
            {t("unexpected.retry")}
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.home}>{t("backHome")}</Link>
          </Button>
        </>
      }
      // Next only sets the digest for server errors; it matches the entry in the server logs.
      folio={error.digest && t("unexpected.reference", { digest: error.digest })}
    />
  );
};
