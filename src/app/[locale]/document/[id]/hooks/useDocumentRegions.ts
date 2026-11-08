import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DocumentRegion } from "@/app/[locale]/document/[id]/lib/page-regions";

interface RegionsResponse {
  regions: DocumentRegion[];
  // False while the parser hasn't processed the current version of the document yet.
  upToDate: boolean;
}

// A document opened for the first time (or after the parser improved) is parsed in the background.
const PENDING_POLL_MS = 15_000;

export const useDocumentRegions = (documentId: string) =>
  useQuery({
    queryKey: ["document-regions", documentId],
    queryFn: async () => (await api.get<RegionsResponse>(`/documents/${documentId}/regions`)).data,
    refetchInterval: (query) => (query.state.data?.upToDate === false ? PENDING_POLL_MS : false),
    staleTime: Infinity,
  });
