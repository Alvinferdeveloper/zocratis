import type { SelectionRect } from "@/app/[locale]/document/[id]/hooks/useTextSelection";

// pdf.js page size to assume when a selection rect didn't report its own.
const FALLBACK_PAGE = { width: 800, height: 1200 };

// A text selection's rects in the shape annotations store, plus the box around them.
export const toAnnotationGeometry = (selectionRects: SelectionRect[], pageNumber: number) => {
  const rects = selectionRects.map((r) => ({
    x1: r.left,
    y1: r.top,
    x2: r.left + r.width,
    y2: r.top + r.height,
    width: r.pageWidth || FALLBACK_PAGE.width,
    height: r.pageHeight || FALLBACK_PAGE.height,
    pageNumber,
  }));
  const boundingRect = {
    x1: Math.min(...rects.map((r) => r.x1)),
    y1: Math.min(...rects.map((r) => r.y1)),
    x2: Math.max(...rects.map((r) => r.x2)),
    y2: Math.max(...rects.map((r) => r.y2)),
    width: rects[0]?.width || FALLBACK_PAGE.width,
    height: rects[0]?.height || FALLBACK_PAGE.height,
    pageNumber,
  };
  return { rects, boundingRect };
};
