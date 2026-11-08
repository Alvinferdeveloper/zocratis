import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Conversation } from "@/app/types";

// The latest conversation started from "ask more" on this explanation, if any. Its key sits under
// the document's conversations, so creating one refreshes it.
export const useFollowUpConversation = (documentId: string, subjectId: string) =>
  useQuery({
    queryKey: ["conversations", documentId, "subject", subjectId],
    queryFn: async () => {
      const { data } = await api.get<Conversation[]>(`/documents/${documentId}/conversations`, {
        params: { subject: subjectId },
      });
      return data[0] ?? null;
    },
  });
