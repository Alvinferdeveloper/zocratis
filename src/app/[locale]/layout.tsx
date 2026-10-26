import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { LocaleParams, OPEN_GRAPH_LOCALES, routing } from "@/i18n/routing";
import { isLocale, resolveLocale } from "@/i18n/paths";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { fontVariables } from "@/app/fonts";

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

// Canonical URLs are set per public page: a root canonical would be inherited by every route.
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "metadata" });
  const defaultTitle = `${siteConfig.name} | ${t("tagline")}`;
  const shareDescription = t("shareDescription");

  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    title: {
      default: defaultTitle,
      template: `%s · ${siteConfig.name}`,
    },
    description: t("description", { brand: siteConfig.name }),
    keywords: [...(t.raw("keywords") as string[]), siteConfig.name],
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALES[locale],
      siteName: siteConfig.name,
      title: defaultTitle,
      description: shareDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: shareDescription,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.colors.backgroundLight },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.colors.backgroundDark },
  ],
};

export default async function LocaleLayout({ children, params }: LocaleParams & { children: React.ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Lets pages below render statically instead of reading the locale from the request.
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontVariables} antialiased`}>
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* App-wide, so the Toaster and every page share one query cache. */}
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
