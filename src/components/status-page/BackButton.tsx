"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

// A link opened in a fresh tab has no page to go back to, so it falls back to home.
export const BackButton: React.FC<{ label: string }> = ({ label }) => {
  const router = useRouter();
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));

  return (
    <Button variant="ghost" onClick={goBack}>
      <ArrowLeft />
      {label}
    </Button>
  );
};
