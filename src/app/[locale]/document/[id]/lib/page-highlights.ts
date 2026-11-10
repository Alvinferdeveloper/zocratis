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

// A box in fractions of its page (0–1), so it follows the page at any zoom.
export interface FractionRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// The part of a highlight that falls on one page.
export interface PageHighlight {
  id: string;
  color: string;
  variant?: "explanation";
  rects: FractionRect[];
}

// Stored rects are in pixels of the page at the size it had when they were made (their width and height).
const toFractionRect = (rect: AnnotationRect): FractionRect => ({
  left: rect.x1 / rect.width,
  top: rect.y1 / rect.height,
  right: rect.x2 / rect.width,
  bottom: rect.y2 / rect.height,
});

export const groupHighlightsByPage = (highlights: PdfHighlightItem[]): Map<number, PageHighlight[]> => {
  const pages = new Map<number, PageHighlight[]>();
  for (const { id, color, variant, rects, pageNumber } of highlights) {
    const rectsByPage = new Map<number, FractionRect[]>();
    for (const rect of rects) {
      const page = rect.pageNumber || pageNumber;
      rectsByPage.set(page, [...(rectsByPage.get(page) ?? []), toFractionRect(rect)]);
    }
    rectsByPage.forEach((pageRects, page) => {
      pages.set(page, [...(pages.get(page) ?? []), { id, color, variant, rects: pageRects }]);
    });
  }
  return pages;
};

// Where a highlight sits on its page, as fractions of the page's height.
export const getHighlightSpan = (item: PdfHighlightItem): { pageNumber: number; top: number; height: number } | null => {
  if (item.rects.length === 0) return null;
  const top = Math.min(...item.rects.map((rect) => rect.y1 / rect.height));
  const bottom = Math.max(...item.rects.map((rect) => rect.y2 / rect.height));
  return { pageNumber: item.rects[0].pageNumber || item.pageNumber, top, height: bottom - top };
};

// Highlights never take the pointer (the text over them does), so the one under a point is found by
// position; the last drawn wins, as it's the one on top. The point is in fractions of the page.
export const findHighlightAt = (highlights: PageHighlight[], x: number, y: number): PageHighlight | undefined =>
  highlights.findLast((highlight) =>
    highlight.rects.some((rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
  );
