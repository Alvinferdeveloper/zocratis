"use client";

import { useState } from "react";
import { ArrowUp, Check, Layers, MessageSquare, RefreshCw, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { showApiErrorToast } from "@/components/api-error-toast";
import type { ExplainSubject } from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { useFollowUpConversation } from "@/app/[locale]/document/[id]/hooks/useFollowUpConversation";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// What the chat gets when the student asks more about an explanation.
export interface ExplanationFollowUp {
  question: string;
  // The explanation it comes from, so a later visit can open the conversation again.
  subjectId: string;
  // Shown as the quoted context of the question: the passage, or the region's label.
  quote: string;
  pageNumber: number;
  image?: string;
  region?: PageRegion;
  explanation: string;
}

export interface ExplainHandlers {
  // The title is what heads the note: the passage, or the region's label.
  onSaveNote: (markdown: string, title: string) => Promise<unknown>;
  // A question about it starts a new chat conversation, where it can go as deep as needed.
  onAskMore: (followUp: ExplanationFollowUp) => void;
  onOpenConversation: (conversationId: string) => void;
  // A passage kept on the page turns into a note instead of saving a second one.
  noteAction: "save" | "convert";
}

interface ExplainActionsProps extends ExplainHandlers {
  documentId: string;
  subject: ExplainSubject;
  // What's on screen as Markdown; null until it has loaded.
  markdown: string | null;
  // The note can be saved once per thing shown.
  viewKey: string;
  title: string;
  isBusy: boolean;
  isCardOpen: boolean;
  onThinkAgain: () => void;
  onOpenCard: () => void;
  // Actions of the kind of explanation, before the shared ones.
  children?: React.ReactNode;
}

// The footer every explanation shares: think again, note, card and asking more in the chat.
export const ExplainActions: React.FC<ExplainActionsProps> = ({
  documentId,
  subject,
  markdown,
  viewKey,
  title,
  isBusy,
  isCardOpen,
  onThinkAgain,
  onOpenCard,
  onSaveNote,
  onAskMore,
  onOpenConversation,
  noteAction,
  children,
}) => {
  const t = useTranslations("reader.explain");
  const { data: followUpConversation } = useFollowUpConversation(documentId, subject.id);
  const [savedViews, setSavedViews] = useState<Set<string>>(new Set());
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [question, setQuestion] = useState("");
  const isSaved = savedViews.has(viewKey);

  const saveNote = async () => {
    if (!markdown) return;
    setIsSavingNote(true);
    try {
      await onSaveNote(markdown, title);
      setSavedViews((current) => new Set(current).add(viewKey));
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const askMore = (event: React.FormEvent) => {
    event.preventDefault();
    if (!markdown || !question.trim()) return;
    onAskMore({
      question: question.trim(),
      subjectId: subject.id,
      quote: title,
      pageNumber: subject.pageNumber,
      image: subject.image,
      region: subject.region,
      explanation: markdown,
    });
  };

  return (
    <footer className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
      <div className="flex flex-wrap items-center gap-1">
        {children}
        <Button variant="ghost" size="sm" onClick={onThinkAgain} disabled={!markdown || isBusy}>
          <RefreshCw />
          {t("thinkAgain")}
        </Button>
        <Button variant="ghost" size="sm" onClick={saveNote} disabled={!markdown || isSaved || isSavingNote}>
          {isSaved ? <Check /> : <StickyNote />}
          {noteAction === "convert" ? t(isSaved ? "convertedToNote" : "convertToNote") : t(isSaved ? "noteSaved" : "saveNote")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenCard} disabled={!markdown || isCardOpen}>
          <Layers />
          {t("card")}
        </Button>
      </div>
      {followUpConversation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenConversation(followUpConversation.id)}
          className="min-w-0 justify-start"
        >
          <MessageSquare />
          <span className="truncate">{t("openConversation", { title: followUpConversation.title })}</span>
        </Button>
      )}
      <form onSubmit={askMore} className="flex items-center gap-1.5">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("askMore")}
          aria-label={t("askMore")}
          disabled={!markdown}
          className="h-8 text-sm md:text-sm"
        />
        <IconButton type="submit" size="icon" variant="default" label={t("askMoreSend")} disabled={!markdown || !question.trim()}>
          <ArrowUp />
        </IconButton>
      </form>
    </footer>
  );
};
