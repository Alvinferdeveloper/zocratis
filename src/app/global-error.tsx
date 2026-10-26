"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { type ErrorBoundaryProps, UnexpectedErrorPage } from "@/components/status-page/UnexpectedErrorPage";
import { splitLocalePath } from "@/i18n/paths";
import type { Locale } from "@/i18n/routing";
import esCommon from "@/messages/es/common.json";
import enCommon from "@/messages/en/common.json";
import { fontVariables } from "./fonts";

const COMMON_MESSAGES: Record<Locale, typeof esCommon> = { es: esCommon, en: enCommon };

// Replaces the locale layout when it fails, so it brings its own <html>, theme and messages.
export default function GlobalError(props: ErrorBoundaryProps) {
  const { locale } = splitLocalePath(usePathname());

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontVariables} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={{ common: COMMON_MESSAGES[locale] }}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <UnexpectedErrorPage {...props} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
