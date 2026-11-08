"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  LanguageCode,
  VocabularyEntry,
  VocabularyExplanation,
} from "@/app/types";
import { useVocabularyExplanation } from "@/app/[locale]/document/[id]/hooks/useVocabularyExplanation";
import { useVocabularyDialog } from "@/app/[locale]/document/[id]/hooks/useVocabularyDialog";
import { LiveAnchorTarget, useLiveAnchor } from "@/app/[locale]/document/[id]/hooks/useLiveAnchor";
import { isScrollbarPointerDown } from "@/app/[locale]/document/[id]/lib/scrollbar";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import { getApiErrorKey } from "@/lib/api-errors";
import { IconButton } from "@/components/ui/icon-button";
import { WordDeckToggle } from "@/app/[locale]/document/[id]/components/flashcards/components/WordDeckToggle";

interface SaveEntryData {
  selectedText: string;
  wordLanguage: string;
  explanationLanguage: string;
  explanation: VocabularyExplanation;
  color: string;
}

interface VocabularyCardProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: LiveAnchorTarget | null;
  // Rendering inside the reader keeps the card clipped under the Header instead of floating over it.
  portalContainer?: HTMLElement | null;
  selectedText: string;
  wordLanguage: LanguageCode;
  explanationLanguage: LanguageCode;
  // The selected text's own language; differs from wordLanguage when studying its equivalent.
  sourceLanguage: LanguageCode;
  documentFileName: string;
  onSaveEntry: (
    data: SaveEntryData,
    editingEntry: VocabularyEntry | null
  ) => Promise<VocabularyEntry>;
  onDeleteEntry?: (id: string) => Promise<void>;
  onColorChange: (id: string, color: string) => Promise<void>;
  onEntryUpdated?: (entry: VocabularyEntry) => void;
  existingEntry?: VocabularyEntry | null;
}

const flipTransition = { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const };

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  isOpen,
  onClose,
  anchor,
  portalContainer,
  selectedText,
  wordLanguage,
  explanationLanguage,
  sourceLanguage,
  documentFileName,
  onSaveEntry,
  onDeleteEntry,
  onColorChange,
  onEntryUpdated,
  existingEntry,
}) => {
  const t = useTranslations("vocabulary.card");
  const tActions = useTranslations("common.actions");
  const dialog = useVocabularyDialog({ isOpen, existingEntry });
  const explanationMutation = useVocabularyExplanation();

  const [localEntry, setLocalEntry] = useState<VocabularyEntry | null>(existingEntry ?? null);
  const [displayExplanation, setDisplayExplanation] = useState<VocabularyExplanation | null>(
    existingEntry?.explanation ?? null
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalEntry(existingEntry ?? null);
      setDisplayExplanation(existingEntry?.explanation ?? null);
      explanationMutation.reset();
    }
  }, [isOpen, existingEntry]);

  const handleClose = () => {
    dialog.handleReset();
    setLocalEntry(null);
    setDisplayExplanation(null);
    explanationMutation.reset();
    onClose();
  };

  const { virtualRef, boundary } = useLiveAnchor(anchor, handleClose);

  const explain = async (editingEntry: VocabularyEntry | null) => {
    try {
      const result = await explanationMutation.mutateAsync({
        selectedText,
        wordLanguage,
        explanationLanguage,
        sourceLanguage,
        documentContext: `Document: ${documentFileName}`,
      });
      setDisplayExplanation(result);
      dialog.setIsFlipped(true);

      const saved = await onSaveEntry(
        {
          selectedText,
          wordLanguage,
          explanationLanguage,
          explanation: result,
          color: dialog.selectedColor,
        },
        editingEntry
      );
      setLocalEntry(saved);
      onEntryUpdated?.(saved);
    } catch {
      // Explanation errors show on the card; save errors through the global mutation toast.
    }
  };

  const handleReveal = () => explain(null);
  const handleRegenerate = () => explain(localEntry);

  const handleChangeColor = async (color: string) => {
    dialog.setSelectedColor(color);
    if (localEntry) {
      await onColorChange(localEntry.id, color);
    }
  };

  const handleDelete = async () => {
    if (!localEntry || !onDeleteEntry) return;
    setIsDeleting(true);
    try {
      await onDeleteEntry(localEntry.id);
      handleClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
        aria-label={t("ariaLabel")}
        className="w-auto border-none bg-transparent p-0 shadow-none"
        style={{ perspective: 1200 }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative">
          <IconButton
            size="icon-sm"
            label={tActions("close")}
            onClick={handleClose}
            className="absolute -top-3 -right-3 z-10 border border-border bg-popover shadow-float"
          >
            <X className="size-3.5" />
          </IconButton>

          <AnimatePresence mode="wait" initial={false}>
            {!dialog.isFlipped ? (
              <motion.div
                key="front"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={flipTransition}
                style={{ transformStyle: "preserve-3d" }}
              >
                <CardFront
                  word={selectedText}
                  wordLanguage={wordLanguage}
                  explanationLanguage={explanationLanguage}
                  sourceLanguage={sourceLanguage}
                  isLoading={explanationMutation.isPending}
                  errorKey={explanationMutation.error && getApiErrorKey(explanationMutation.error)}
                  onReveal={handleReveal}
                />
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={flipTransition}
                style={{ transformStyle: "preserve-3d" }}
              >
                {displayExplanation && (
                  <CardBack
                    explanation={displayExplanation}
                    wordLanguage={wordLanguage}
                    explanationLanguage={explanationLanguage}
                    isRegenerating={explanationMutation.isPending}
                    onRegenerate={handleRegenerate}
                    isEditMode={!!localEntry}
                    onDelete={
                      localEntry && onDeleteEntry
                        ? () => setIsDeleteConfirmOpen(true)
                        : undefined
                    }
                    isDeleting={isDeleting}
                    selectedColor={dialog.selectedColor}
                    onColorChange={handleChangeColor}
                    deckAction={localEntry && <WordDeckToggle entry={localEntry} />}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={handleDelete}
          title={t("deleteConfirm.title")}
          description={t("deleteConfirm.description")}
          confirmText={t("deleteConfirm.confirm")}
          isLoading={isDeleting}
        />
      </PopoverContent>
    </Popover>
  );
};
