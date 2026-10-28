import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { Annotation } from "@/app/types";
import { showApiErrorToast } from "@/components/api-error-toast";
import { useCreateAnnotation } from "@/app/[locale]/document/[id]/hooks/useAnnotations";
import { buildChatNote, type ChatReply } from "@/app/[locale]/document/[id]/lib/chat-note";
import { DEFAULT_NOTE_COLOR } from "@/app/[locale]/document/[id]/lib/note-colors";

export interface UseChatNotesReturn {
  // Notes saved in this session, by the reply they came from.
  savedNotes: Record<string, Annotation>;
  savingMessageId: string | null;
  save: (reply: ChatReply) => void;
}

// Saves a chat reply as a note in one click, on the page it's about (or the one being read).
export const useChatNotes = (documentId: string, currentPage: number): UseChatNotesReturn => {
  const t = useTranslations("chat");
  const { mutate: createAnnotation } = useCreateAnnotation(documentId);
  const [savedNotes, setSavedNotes] = useState<Record<string, Annotation>>({});
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);

  const save = useCallback(
    (reply: ChatReply) => {
      setSavingMessageId(reply.messageId);
      const note = buildChatNote(reply, currentPage, (page) => t("pageCaption", { page }));
      createAnnotation(
        { ...note, color: DEFAULT_NOTE_COLOR, origin: "chat" },
        {
          onSuccess: (annotation) => setSavedNotes((saved) => ({ ...saved, [reply.messageId]: annotation })),
          onError: showApiErrorToast,
          onSettled: () => setSavingMessageId(null),
        }
      );
    },
    [createAnnotation, currentPage, t]
  );

  return { savedNotes, savingMessageId, save };
};
