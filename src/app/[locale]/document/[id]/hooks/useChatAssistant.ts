import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import { Message } from "@/app/types";
import { useFetchMessages } from "@/app/[locale]/document/[id]/hooks/useFetchMessages";
import { type ChatFollowUp, type ChatUIMessage, getMessageText } from "@/app/[locale]/document/[id]/lib/chat-message";
import { apiUrl } from "@/lib/api-client";
import { useRefreshUsage } from "@/app/[locale]/subscription/hooks/useSubscription";

interface UseChatAssistantOptions {
  documentId: string;
  conversationId: string | null;
}

export interface UseChatAssistantReturn {
  messages: ChatUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  isLoadingHistory: boolean;
  send: (text: string, followUp?: ChatFollowUp) => void;
  retry: () => void;
  stop: () => void;
}

// useChat builds its Chat (transport + callbacks) once per id, so keying it by conversation keeps them bound to it.
const DRAFT_CHAT_ID = "draft";

const toUIMessage = (message: Message): ChatUIMessage => ({
  id: message.id,
  role: message.role,
  metadata: { sources: message.sources ?? [], region: message.region ?? undefined },
  parts: [{ type: "text", text: message.content }],
});

export const useChatAssistant = ({
  documentId,
  conversationId,
}: UseChatAssistantOptions): UseChatAssistantReturn => {
  const history = useFetchMessages(documentId, conversationId);
  const queryClient = useQueryClient();
  const refreshUsage = useRefreshUsage();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiUrl("/ai/chat"),
        credentials: "include",
        // The server keeps the history; send only the message to answer (on retry, the same one again).
        // A follow-up's image and explanation ride along with that one message (a retry goes without).
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, conversationId, message: getMessageText(messages[messages.length - 1]) },
        }),
      }),
    [conversationId]
  );

  const { messages, sendMessage, setMessages, status, error, regenerate, stop } = useChat<ChatUIMessage>({
    id: conversationId ?? DRAFT_CHAT_ID,
    transport,
    // The server stored both turns and charged (or refunded) the reply; refresh what changed.
    onFinish: () => {
      refreshUsage();
      queryClient.invalidateQueries({ queryKey: ["messages", documentId, conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", documentId] });
    },
  });

  const hydratedConversation = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !history.data || hydratedConversation.current === conversationId) return;
    hydratedConversation.current = conversationId;
    if (messages.length === 0) setMessages(history.data.map(toUIMessage));
  }, [conversationId, history.data, messages.length, setMessages]);

  const send = useCallback(
    (text: string, followUp?: ChatFollowUp) => {
      if (!conversationId) return;
      sendMessage(
        { text, metadata: followUp?.region ? { region: followUp.region } : undefined },
        followUp ? { body: { ...followUp } } : undefined
      );
    },
    [conversationId, sendMessage]
  );

  const retry = useCallback(() => {
    regenerate();
  }, [regenerate]);

  return {
    messages,
    status,
    error,
    isLoadingHistory: history.isLoading,
    send,
    retry,
    stop,
  };
};
