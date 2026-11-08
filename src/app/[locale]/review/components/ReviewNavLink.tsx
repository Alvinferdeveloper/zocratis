"use client";

import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { NavItem, NavItemCount } from "@/components/ui/nav-item";
import { useReviewSummary } from "@/app/[locale]/review/hooks/useReview";

// The global review in the workspace navigation; absent for people who have no cards.
export const ReviewNavLink: React.FC = () => {
  const t = useTranslations("review");
  const { data: summary } = useReviewSummary();

  if (!summary?.total) return null;

  return (
    <NavItem asChild>
      <Link href={ROUTES.review()}>
        <Layers />
        <span className="flex-1">{t("title")}</span>
        {summary.due > 0 && (
          <NavItemCount className="font-semibold text-foreground">
            <span className="sr-only">{t("dueCount", { count: summary.due })}</span>
            <span aria-hidden>{summary.due}</span>
          </NavItemCount>
        )}
      </Link>
    </NavItem>
  );
};
