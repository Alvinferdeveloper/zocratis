import type { UIMessage } from "ai";
import type { ChatSource } from "@/app/types";

// The server sends a reply's sources as message metadata when the stream starts.
export type ChatUIMessage = UIMessage<{ sources?: ChatSource[] }>;

export interface ChatContext {
  text: string;
  page: number;
}

interface ParsedChatMessage {
  context: ChatContext | null;
  question: string;
}

const PAGE_LINE = /^\(pág\. (\d+)\)$/;
const SUGGESTIONS_TAG = "[SUGGESTIONS]";
const SUGGESTIONS_MARKER = /\[SUGGESTIONS\]([\s\S]*)$/i;
const MAX_SUGGESTIONS = 3;

// The quote travels as a markdown blockquote so the model reads it natively and it persists as plain text.
export const composeChatMessage = (question: string, context: ChatContext | null): string => {
  if (!context) return question;
  const quote = context.text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `${quote}\n> (pág. ${context.page})\n\n${question}`;
};

export const parseChatMessage = (text: string): ParsedChatMessage => {
  const lines = text.split("\n");
  const quoteEnd = lines.findIndex((line) => !line.startsWith(">"));
  if (quoteEnd <= 0) return { context: null, question: text };

  const quoted = lines.slice(0, quoteEnd).map((line) => line.replace(/^> ?/, ""));
  const pageMatch = quoted.at(-1)?.match(PAGE_LINE);
  if (!pageMatch) return { context: null, question: text };

  return {
    context: { text: quoted.slice(0, -1).join("\n"), page: Number(pageMatch[1]) },
    question: lines.slice(quoteEnd).join("\n").trim(),
  };
};

// While streaming, the tag can arrive split ("[SUGG"); hide it until it's complete.
const stripPartialTag = (text: string): string => {
  const start = text.lastIndexOf("[");
  if (start === -1) return text;
  const tail = text.slice(start).toUpperCase();
  return SUGGESTIONS_TAG.startsWith(tail) ? text.slice(0, start) : text;
};

// The backend appends follow-up questions after a [SUGGESTIONS] marker.
export const splitAssistantText = (text: string): { content: string; suggestions: string[] } => {
  const match = text.match(SUGGESTIONS_MARKER);
  if (!match || match.index === undefined) return { content: stripPartialTag(text).trim(), suggestions: [] };

  const suggestions = match[1]
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0 && line !== "NONE")
    .slice(0, MAX_SUGGESTIONS);

  return { content: text.slice(0, match.index).trim(), suggestions };
};

// "[2]" becomes a "#source-2" link when that source exists; "arr[2]" and existing links are left alone.
const CITATION = /(?<!\w)\[(\d+)\](?!\()/g;
export const SOURCE_HREF_PREFIX = "#source-";

export const linkCitations = (text: string, sourceCount: number): string =>
  text.replace(CITATION, (marker, n: string) => {
    const index = Number(n);
    return index >= 1 && index <= sourceCount ? `[${n}](${SOURCE_HREF_PREFIX}${n})` : marker;
  });

// For text that leaves the chat (a saved note): "[2]" becomes the page its source is on.
export const replaceCitations = (text: string, sources: ChatSource[], pageLabel: (page: number) => string): string =>
  text.replace(CITATION, (marker, n: string) => {
    const source = sources[Number(n) - 1];
    return source ? `(${pageLabel(source.pageNumber)})` : marker;
  });

export const getMessageText =(message: { parts: Array<{ type: string; text?: string }> }): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
