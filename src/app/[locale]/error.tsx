"use client";

import { type ErrorBoundaryProps, UnexpectedErrorPage } from "@/components/status-page/UnexpectedErrorPage";

export default function ErrorPage(props: ErrorBoundaryProps) {
  return <UnexpectedErrorPage {...props} />;
}
