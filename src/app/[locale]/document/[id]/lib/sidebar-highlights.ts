import type { Annotation, AnnotationOrigin, VocabularyEntry } from "@/app/types";

// What the reader sidebar lists for a note or a saved word.
export interface SidebarHighlight {
  id: string;
  pageNumber: number;
  color: string;
  title: string;
  detail?: string;
  // Notes only: where a note without a highlight came from.
  origin?: AnnotationOrigin;
}

// Notes are Markdown; the sidebar previews them as plain text.
const toPlainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/[#>*_`~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const noteToSidebarHighlight = (note: Annotation): SidebarHighlight => ({
  id: note.id,
  pageNumber: note.pageNumber,
  color: note.color,
  title: note.selectedText,
  detail: note.comment || (note.aiResponse ? toPlainText(note.aiResponse) : undefined),
  origin: note.origin,
});

export const wordToSidebarHighlight = (entry: VocabularyEntry): SidebarHighlight => ({
  id: entry.id,
  pageNumber: entry.pageNumber,
  color: entry.color,
  title: entry.explanation?.word ?? entry.selectedText,
  detail: entry.explanation?.meanings[0]?.definition,
});

// Accent- and case-insensitive, so "derivacion" finds "derivación".
const normalize = (text: string): string => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const searchHighlights = (items: SidebarHighlight[], query: string): SidebarHighlight[] => {
  const needle = normalize(query.trim());
  if (!needle) return items;
  return items.filter((item) => normalize(`${item.title} ${item.detail ?? ""}`).includes(needle));
};

// Pages in document order, each with its items (highlights, search results).
export const groupByPage = <T extends { pageNumber: number }>(items: T[]): [number, T[]][] => {
  const pages = new Map<number, T[]>();
  for (const item of items) pages.set(item.pageNumber, [...(pages.get(item.pageNumber) ?? []), item]);
  return [...pages.entries()].sort(([a], [b]) => a - b);
};
