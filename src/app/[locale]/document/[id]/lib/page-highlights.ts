import type { AnnotationRect, BoundingRect } from "@/app/types";

export interface PdfHighlightItem {
  id: string;
  color: string;
  // An explained passage: a light ink tint and underline instead of the note color.
  variant?: "explanation";
  selectedText: string;
  pageNumber: number;
  boundingRect: BoundingRect;
  rects: AnnotationRect[];
}

// One box of a highlight, in fractions of its page, so it follows the page at any zoom.
export interface HighlightPart {
  id: string;
  color: string;
  variant?: "explanation";
  left: number;
  top: number;
  width: number;
  height: number;
}

export const HIGHLIGHT_PART_CLASS = "highlight-part";

// Stored rects are in pixels of the page at the size it had when they were made (their width and height).
const toPart = (item: PdfHighlightItem, rect: AnnotationRect): HighlightPart => ({
  id: item.id,
  color: item.color,
  variant: item.variant,
  left: rect.x1 / rect.width,
  top: rect.y1 / rect.height,
  width: (rect.x2 - rect.x1) / rect.width,
  height: (rect.y2 - rect.y1) / rect.height,
});

export const groupPartsByPage = (highlights: PdfHighlightItem[]): Map<number, HighlightPart[]> => {
  const pages = new Map<number, HighlightPart[]>();
  for (const item of highlights) {
    for (const rect of item.rects) {
      const pageNumber = rect.pageNumber || item.pageNumber;
      const parts = pages.get(pageNumber);
      if (parts) parts.push(toPart(item, rect));
      else pages.set(pageNumber, [toPart(item, rect)]);
    }
  }
  return pages;
};

// Where a highlight sits on its page, as fractions of the page's height.
export const getHighlightSpan = (item: PdfHighlightItem): { pageNumber: number; top: number; height: number } | null => {
  if (item.rects.length === 0) return null;
  const tops = item.rects.map((rect) => rect.y1 / rect.height);
  const bottoms = item.rects.map((rect) => rect.y2 / rect.height);
  const top = Math.min(...tops);
  return { pageNumber: item.rects[0].pageNumber || item.pageNumber, top, height: Math.max(...bottoms) - top };
};

// Highlights never take the pointer (the text above them does), so the one under a point is found by position.
export const findHighlightPartAt = (page: Element, x: number, y: number): HTMLElement | null => {
  const parts = Array.from(page.querySelectorAll<HTMLElement>(`.${HIGHLIGHT_PART_CLASS}`));
  return (
    parts.reverse().find((part) => {
      const rect = part.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) ?? null
  );
};
