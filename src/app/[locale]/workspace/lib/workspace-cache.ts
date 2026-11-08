import type { QueryClient } from "@tanstack/react-query";

// Every workspace listing that shows documents, folders or their counts.
const WORKSPACE_QUERY_KEYS = [["items"], ["recent-documents"], ["topics"], ["folders"]];

export const invalidateWorkspace = (queryClient: QueryClient): void => {
  WORKSPACE_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
};
