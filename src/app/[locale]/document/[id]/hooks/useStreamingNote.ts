import { useCompletion } from "@ai-sdk/react";
import { useCallback, useRef } from "react";
import { apiUrl } from "@/lib/api-client";
import { useRefreshUsage } from "@/app/[locale]/subscription/hooks/useSubscription";

interface UseStreamingNoteOptions {
  apiEndpoint?: string;
}

interface UseStreamingNoteBody {
  selectedText: string;
  prompt: string;
  documentContext?: string;
  originalNote?: string;
  responseLanguage?: string;
}

interface UseStreamingNoteReturn {
  completion: string;
  isLoading: boolean;
  error: Error | undefined;
  // Rejects with the request error; resolves empty when stopped by the user.
  complete: (prompt: string, body: UseStreamingNoteBody) => Promise<string | null | undefined>;
  stop: () => void;
  setCompletion: (completion: string) => void;
}

export const useStreamingNote = (options: UseStreamingNoteOptions = {}): UseStreamingNoteReturn => {
  const { apiEndpoint = apiUrl("/ai/notes/stream") } = options;
  const lastError = useRef<Error | null>(null);
  const refreshUsage = useRefreshUsage();

  const {
    completion,
    isLoading,
    error,
    complete,
    stop,
    setCompletion,
  } = useCompletion({
    api: apiEndpoint,
    streamProtocol: "text",
    body: {},
    credentials: 'include',
    // useCompletion resolves null on failure; keep the error so complete() can reject with it.
    onError: (requestError) => {
      lastError.current = requestError;
    },
  });

  const wrappedComplete = useCallback(
    async (prompt: string, body: UseStreamingNoteBody) => {
      lastError.current = null;
      try {
        const result = await complete(prompt, { body });
        if (lastError.current) throw lastError.current;
        return result;
      } finally {
        refreshUsage();
      }
    },
    [complete, refreshUsage]
  );

  return {
    completion,
    isLoading,
    error,
    complete: wrappedComplete,
    stop,
    setCompletion,
  };
};
