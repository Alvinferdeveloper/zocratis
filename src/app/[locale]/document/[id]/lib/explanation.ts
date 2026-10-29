import type { Explanation } from "@/app/[locale]/document/[id]/hooks/useExplanation";

const EXCERPT_LENGTH = 80;

// Enough of a passage to recognise it on a card or in the card's trail.
export const toExcerpt = (text: string): string => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()}…` : flat;
};

// What a saved explanation looks like as a note: the term (if any), the core idea, then the rest.
export const explanationToMarkdown = (explanation: Explanation, term: string | null): string =>
  [term && `### ${term}`, `**${explanation.coreIdea}**`, explanation.explanation].filter(Boolean).join("\n\n");
