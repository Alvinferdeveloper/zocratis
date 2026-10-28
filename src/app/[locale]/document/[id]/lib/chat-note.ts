import type { ChatSource } from "@/app/types";
import {
  type ChatContext,
  type ChatUIMessage,
  getMessageText,
  parseChatMessage,
  replaceCitations,
  splitAssistantText,
} from "@/app/[locale]/document/[id]/lib/chat-message";

// An assistant reply with the question that prompted it: what a chat note is made from.
export interface ChatReply {
  messageId: string;
  question: string;
  context: ChatContext | null;
  answer: string;
  sources: ChatSource[];
}

export const getChatReply = (messages: ChatUIMessage[], index: number): ChatReply => {
  const reply = messages[index];
  const asked = messages.slice(0, index).findLast((message) => message.role === "user");
  const { context, question } = parseChatMessage(asked ? getMessageText(asked) : "");
  return {
    messageId: reply.id,
    question,
    context,
    answer: splitAssistantText(getMessageText(reply)).content,
    sources: reply.metadata?.sources ?? [],
  };
};

interface ChatNoteContent {
  selectedText: string;
  aiResponse: string;
  pageNumber: number;
}

// The question heads the note; the quoted passage (if any) opens its body, above the answer.
export const buildChatNote = (
  reply: ChatReply,
  fallbackPage: number,
  pageLabel: (page: number) => string
): ChatNoteContent => {
  const answer = replaceCitations(reply.answer, reply.sources, pageLabel);
  const quote = reply.context
    ? `${reply.context.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}\n>\n> ${pageLabel(reply.context.page)}\n\n`
    : "";

  return {
    selectedText: reply.question,
    aiResponse: `${quote}${answer}`,
    pageNumber: reply.context?.page ?? reply.sources[0]?.pageNumber ?? fallbackPage,
  };
};
