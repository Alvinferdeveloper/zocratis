import { useEffect } from "react";
import type { ChatStatus } from "ai";
import type { Annotation, ChatSource } from "@/app/types";
import { cn } from "@/lib/utils";
import type { UseChatNotesReturn } from "@/app/[locale]/document/[id]/hooks/useChatNotes";
import { getChatReply } from "@/app/[locale]/document/[id]/lib/chat-note";
import { useStickToBottom } from "@/app/[locale]/document/[id]/hooks/useStickToBottom";
import { type ChatUIMessage, getMessageText } from "@/app/[locale]/document/[id]/lib/chat-message";
import { AssistantMessage, AssistantMarkState } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import { SaveNoteButton } from "./SaveNoteButton";
import type { ApiErrorKey } from "@/lib/api-errors";
import { ChatError, MessagesSkeleton, PendingReply } from "./ChatStatus";

const NO_SOURCES: ChatSource[] = [];

interface ChatMessageListProps {
  messages: ChatUIMessage[];
  status: ChatStatus;
  errorKey: ApiErrorKey | null;
  isLoadingHistory: boolean;
  emptyState: React.ReactNode;
  onRetry: () => void;
  onSuggestionSelect: (suggestion: string) => void;
  onSourceSelect: (source: ChatSource) => void;
  chatNotes: UseChatNotesReturn;
  onNoteOpen: (note: Annotation) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  status,
  errorKey,
  isLoadingHistory,
  emptyState,
  onRetry,
  onSuggestionSelect,
  onSourceSelect,
  chatNotes,
  onNoteOpen,
}) => {
  const { scrollRef, contentRef, scrollToBottom } = useStickToBottom();
  const lastMessage = messages.at(-1);
  const isAwaitingReply =
    status === "submitted" || (status === "streaming" && lastMessage?.role === "user");

  // Sending always brings your own message into view, even if you had scrolled up.
  useEffect(() => {
    if (lastMessage?.role === "user") scrollToBottom();
  }, [lastMessage?.id, lastMessage?.role, scrollToBottom]);

  const getMarkState = (index: number): AssistantMarkState => {
    if (index !== messages.length - 1) return "hidden";
    return status === "streaming" ? "working" : "idle";
  };

  // Older replies show the action on hover or focus; the latest one, once it has finished, always.
  const renderNoteAction = (index: number) => {
    const isLatest = index === messages.length - 1;
    if (isLatest && status !== "ready") return null;

    const messageId = messages[index].id;
    const savedNote = chatNotes.savedNotes[messageId];
    return (
      <div
        className={cn(
          !isLatest &&
            !savedNote &&
            "opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
        )}
      >
        <SaveNoteButton
          isSaving={chatNotes.savingMessageId === messageId}
          isSaved={Boolean(savedNote)}
          onSave={() => chatNotes.save(getChatReply(messages, index))}
          onOpen={() => savedNote && onNoteOpen(savedNote)}
        />
      </div>
    );
  };

  const renderMessages = () => {
    if (isLoadingHistory) return <MessagesSkeleton />;
    if (messages.length === 0 && status === "ready") return emptyState;

    return messages.map((message, index) => {
      const text = getMessageText(message);
      return message.role === "user" ? (
        <UserMessage key={message.id} text={text} />
      ) : (
        <AssistantMessage
          key={message.id}
          text={text}
          sources={message.metadata?.sources ?? NO_SOURCES}
          markState={getMarkState(index)}
          showSuggestions={index === messages.length - 1 && status === "ready"}
          actions={renderNoteAction(index)}
          onSuggestionSelect={onSuggestionSelect}
          onSourceSelect={onSourceSelect}
        />
      );
    });
  };

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      <div ref={contentRef} className="mx-auto flex min-h-full w-full max-w-[68ch] flex-col gap-6 px-4 py-6">
        {renderMessages()}
        {isAwaitingReply && <PendingReply />}
        {status === "error" && <ChatError errorKey={errorKey} onRetry={onRetry} />}
      </div>
    </div>
  );
};
