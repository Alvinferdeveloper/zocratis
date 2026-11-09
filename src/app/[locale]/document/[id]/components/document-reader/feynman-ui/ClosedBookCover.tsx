"use client";

import { BookOpen, BookX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ClosedBookCoverProps {
  isPeeking: boolean;
  onTogglePeek: () => void;
}

// Covers the document (and its sidebar, which shows notes) while the student writes from memory.
export const ClosedBookCover: React.FC<ClosedBookCoverProps> = ({ isPeeking, onTogglePeek }) => {
  const t = useTranslations("feynman.cover");

  if (isPeeking) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
        <Button variant="outline" size="sm" onClick={onTogglePeek} className="pointer-events-auto bg-card shadow-float">
          <BookX />
          {t("hide")}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-reader-canvas p-8 text-center animate-in fade-in duration-200">
      <BookOpen aria-hidden className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{t("title")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t("hint")}</p>
      <Button variant="outline" size="sm" onClick={onTogglePeek}>
        {t("peek")}
      </Button>
    </div>
  );
};
