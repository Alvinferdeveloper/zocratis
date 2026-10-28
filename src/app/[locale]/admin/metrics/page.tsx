import type { Metadata } from "next";
import { privatePageMetadata } from "@/config/seo";
import { LocaleParams } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/paths";
import { MetricsDashboard } from "./components/MetricsDashboard";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return privatePageMetadata(resolveLocale((await params).locale), "adminMetrics");
}

export default function AdminMetricsPage() {
  return <MetricsDashboard />;
}
