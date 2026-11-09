"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { showApiErrorToast } from "@/components/api-error-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { FeynmanIdea } from "@/app/[locale]/document/[id]/hooks/useFeynman";
import {
  useCreateFlashcard,
  useFlashcards,
} from "@/app/[locale]/document/[id]/components/flashcards/hooks/useFlashcards";

interface FeynmanCardsProps {
  documentId: string;
  pageNumber: number;
  ideas: FeynmanIdea[];
}

// What failed can go to review, by choice. An idea's card is fixed with the idea, so one already in the deck isn't offered again.
export const FeynmanCards: React.FC<FeynmanCardsProps> = ({ documentId, pageNumber, ideas }) => {
  const t = useTranslations("feynman.cards");
  const { data: deck = [] } = useFlashcards(documentId);
  const createCard = useCreateFlashcard(documentId);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const inDeck = new Set(deck.map((card) => card.front));
  const candidates = ideas.flatMap((idea) =>
    idea.status !== "mastered" && idea.card && !inDeck.has(idea.card.front) ? [{ idea, card: idea.card }] : []
  );
  const chosen = candidates.filter(({ card }) => !excluded.has(card.front));

  if (candidates.length === 0) return null;

  const toggle = (front: string, checked: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (checked) next.delete(front);
      else next.add(front);
      return next;
    });

  const addCards = async () => {
    setIsAdding(true);
    try {
      await Promise.all(
        chosen.map(({ idea, card }) =>
          createCard.mutateAsync({ ...card, pageNumber: idea.page ?? pageNumber, source: "feynman" })
        )
      );
      toast.success(t("added", { count: chosen.length }));
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className="flex flex-col gap-1">
      <h3 className="mb-1 text-[13px] font-medium">{t("title")}</h3>
      {candidates.map(({ card }) => (
        <label key={card.front} className="flex items-start gap-2 py-1 text-sm">
          <Checkbox
            checked={!excluded.has(card.front)}
            onCheckedChange={(checked) => toggle(card.front, checked === true)}
            className="mt-0.5"
          />
          <span>{card.front}</span>
        </label>
      ))}
      <Button variant="secondary" size="sm" onClick={addCards} disabled={chosen.length === 0 || isAdding} className="mt-1 self-start">
        {t("add", { count: chosen.length })}
      </Button>
    </section>
  );
};
