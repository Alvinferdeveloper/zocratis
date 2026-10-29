import { useEffect } from "react";
import { api } from "@/lib/api-client";

// Mirrors the API catalog (estudia-api `events/events.catalog.ts`): an unknown name is rejected there.
interface ProductEvents {
  workspace_opened: undefined;
  reader_opened: { documentId: string };
  flashcard_proposals_saved: { proposed: number; kept: number; edited: number };
  comprehension_checked: { passed: boolean };
}

type ProductEventName = keyof ProductEvents;
type EventArgs<Name extends ProductEventName> = ProductEvents[Name] extends undefined
  ? [name: Name]
  : [name: Name, properties: ProductEvents[Name]];

// Fire and forget: losing a metric must never get in the way of studying.
const postEvent = (name: ProductEventName, properties?: object): void => {
  api.post("/events", { name, properties }).catch(() => undefined);
};

export const trackEvent = <Name extends ProductEventName>(...[name, properties]: EventArgs<Name>): void =>
  postEvent(name, properties);

// Once per mount; the key changes when the tracked thing does (another document).
export const useTrackOnMount = <Name extends ProductEventName>(...[name, properties]: EventArgs<Name>): void => {
  const key = JSON.stringify(properties ?? null);
  useEffect(() => {
    postEvent(name, JSON.parse(key) ?? undefined);
  }, [name, key]);
};
