"use client";

import { useState } from "react";
import { ArrowUpRight, CircleHelp, GraduationCap, Languages, Pencil, PenLine, StickyNote, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MarkdownRenderer } from "@/app/[locale]/document/[id]/components/document-reader/note-ui";
import type { Flashcard, FlashcardSource } from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";

const SOURCE_ICONS: Record<FlashcardSource, React.ComponentType<{ className?: string }>> = {
  manual: PenLine,
  note: StickyNote,
  vocabulary: Languages,
  check: CircleHelp,
  feynman: GraduationCap,
};

// Where the card stands in spaced repetition: not started, due, or when it comes back.
const ReviewStatus: React.FC<{ card: Flashcard }> = ({ card }) => {
  const t = useTranslations("flashcards.item");
  const format = useFormatter();
  const now = new Date();
  const due = new Date(card.due);

  if (card.state === "new") return <span>{t("notStarted")}</span>;
  if (due <= now) return <span className="text-foreground">{t("dueNow")}</span>;
  return <span>{t("nextReview", { when: format.relativeTime(due, now) })}</span>;
};

interface FlashcardItemProps {
  card: Flashcard;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export const FlashcardItem: React.FC<FlashcardItemProps> = ({ card, onEdit, onDelete }) => {
  const t = useTranslations("flashcards");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const SourceIcon = SOURCE_ICONS[card.source];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    // Two faces of an index card: the question on the sheet, the answer on the shaded side.
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 py-3 pl-5 pr-3">
        <p className="min-w-0 flex-1 py-1 text-[15px] font-medium leading-snug text-foreground">{card.front}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label={t("item.edit")} size="icon-sm" onClick={onEdit}>
            <Pencil />
          </IconButton>
          <IconButton
            label={t("item.delete")}
            size="icon-sm"
            variant="ghost-destructive"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2 />
          </IconButton>
        </div>
      </div>

      <div className="border-t border-border bg-muted/50 px-5 py-3.5">
        <MarkdownRenderer content={card.back} compact className="px-0 text-sm text-foreground/80" />
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <SourceIcon aria-hidden className="size-3.5" />
            {t(`source.${card.source}`)}
          </span>
          {card.pageNumber && (
            <>
              <span aria-hidden>·</span>
              <Link
                href={ROUTES.documentPage(card.documentId, card.pageNumber)}
                title={t("item.seeInDocument")}
                className="inline-flex items-center gap-0.5 rounded-sm underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("item.page", { page: card.pageNumber })}
                <ArrowUpRight aria-hidden className="size-3" />
              </Link>
            </>
          )}
          <span aria-hidden>·</span>
          <ReviewStatus card={card} />
        </p>
      </div>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        onConfirm={handleDelete}
        title={t("item.confirmDelete.title")}
        description={t("item.confirmDelete.description")}
        confirmText={t("item.confirmDelete.confirm")}
        variant="destructive"
        isLoading={isDeleting}
      />
    </li>
  );
};
