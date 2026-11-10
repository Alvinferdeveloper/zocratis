"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FlashcardForm } from "@/app/[locale]/document/[id]/components/flashcards/components/FlashcardForm";
import { useCreateFlashcard } from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";
import { FLASHCARD_BACK_MAX_LENGTH } from "@/app/[locale]/document/[id]/components/flashcards/lib/flashcard-limits";

interface ExplainCardFormProps {
  documentId: string;
  pageNumber: number;
  front: string;
  back: string;
  onClose: () => void;
}

// A flashcard suggested from an explanation, to edit before keeping it.
export const ExplainCardForm: React.FC<ExplainCardFormProps> = ({ documentId, pageNumber, front, back, onClose }) => {
  const t = useTranslations("flashcards");
  const createCard = useCreateFlashcard(documentId);

  const saveCard = async (card: { front: string; back: string }) => {
    await createCard.mutateAsync({ ...card, pageNumber });
    toast.success(t("selection.saved"));
    onClose();
  };

  return (
    <FlashcardForm
      initial={{ front, back: back.slice(0, FLASHCARD_BACK_MAX_LENGTH) }}
      submitLabel={t("form.save")}
      onSubmit={saveCard}
      onCancel={onClose}
      isPending={createCard.isPending}
      error={createCard.error}
    />
  );
};
