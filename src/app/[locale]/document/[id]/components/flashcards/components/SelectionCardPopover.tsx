"use client";

import { useEffect } from "react";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { LiveAnchorTarget, useLiveAnchor } from "@/app/[locale]/document/[id]/hooks/useLiveAnchor";
import { isScrollbarPointerDown } from "@/app/[locale]/document/[id]/lib/scrollbar";
import { useCreateFlashcard } from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";
import { FlashcardForm } from "@/app/[locale]/document/[id]/components/flashcards/components/FlashcardForm";
import { FLASHCARD_BACK_MAX_LENGTH } from "@/app/[locale]/document/[id]/components/flashcards/lib/flashcard-limits";

export interface CardSelection {
  text: string;
  pageNumber: number;
  anchor: LiveAnchorTarget;
}

interface SelectionCardPopoverProps {
  documentId: string;
  selection: CardSelection | null;
  onClose: () => void;
  // Rendering inside the reader keeps the popover clipped under the Header instead of floating over it.
  portalContainer?: HTMLElement | null;
}

// A manual card anchored to the selected passage: the passage is the answer, the user writes the question.
export const SelectionCardPopover: React.FC<SelectionCardPopoverProps> = ({
  documentId,
  selection,
  onClose,
  portalContainer,
}) => {
  const t = useTranslations("flashcards");
  const createCard = useCreateFlashcard(documentId);
  const { virtualRef, boundary } = useLiveAnchor(selection?.anchor ?? null, onClose);
  const { reset } = createCard;

  useEffect(() => {
    if (selection) reset();
  }, [selection, reset]);

  const handleSubmit = async (card: { front: string; back: string }) => {
    if (!selection) return;
    await createCard.mutateAsync({ ...card, pageNumber: selection.pageNumber });
    toast.success(t("selection.saved"));
    onClose();
  };

  return (
    <Popover open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      {virtualRef && <PopoverAnchor virtualRef={virtualRef} />}

      <PopoverContent
        container={portalContainer}
        side="bottom"
        align="start"
        sideOffset={10}
        collisionPadding={16}
        collisionBoundary={boundary ?? []}
        onPointerDownOutside={(e) => {
          if (isScrollbarPointerDown(e.detail.originalEvent)) e.preventDefault();
        }}
        // Grabbing the PDF scrollbar can move focus into the viewer; only real clicks outside should close it.
        onFocusOutside={(e) => {
          if (boundary?.contains(e.detail.originalEvent.target as Node)) e.preventDefault();
        }}
        aria-label={t("selection.ariaLabel")}
        className="w-[min(24rem,calc(100vw-2rem))] origin-(--radix-popover-content-transform-origin) p-0"
      >
        {selection && (
          <>
            <p className="flex items-center gap-1.5 px-4 pt-4 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <Layers className="size-3.5" />
              {t("selection.title", { page: selection.pageNumber })}
            </p>
            <FlashcardForm
              initial={{ front: "", back: selection.text.slice(0, FLASHCARD_BACK_MAX_LENGTH) }}
              submitLabel={t("form.save")}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isPending={createCard.isPending}
              error={createCard.error}
              className="rounded-none border-none bg-transparent pt-3"
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
