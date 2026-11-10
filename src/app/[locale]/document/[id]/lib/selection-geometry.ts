import type { SelectionRect, TextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const findPage = (node: Node): HTMLElement | null =>
  (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>(".page") ?? null;

// Boxes of the selected text only: a range's own rects also include pdf.js's helper elements.
const getTextRects = (range: Range): DOMRect[] => {
  const root = range.commonAncestorContainer;
  if (root instanceof Text) return Array.from(range.getClientRects());

  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!range.intersectsNode(node)) continue;
    const part = document.createRange();
    part.selectNodeContents(node);
    if (node === range.startContainer) part.setStart(node, range.startOffset);
    if (node === range.endContainer) part.setEnd(node, range.endOffset);
    rects.push(...part.getClientRects());
  }
  return rects;
};

// Two boxes share a line when they overlap vertically by more than half of the shorter one.
const onSameLine = (a: Box, b: Box): boolean =>
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.bottom - a.top, b.bottom - b.top) / 2;

// One box per line (and per column): pdf.js draws a span per run of text, which leaves gaps and overlaps.
const mergeByLine = (boxes: Box[]): Box[] => {
  const lines: Box[][] = [];
  for (const box of boxes) {
    const line = lines.find((candidate) => onSameLine(candidate[0], box));
    if (line) line.push(box);
    else lines.push([box]);
  }

  return lines.flatMap((line) => {
    const merged: Box[] = [];
    for (const box of line.sort((a, b) => a.left - b.left)) {
      const last = merged[merged.length - 1];
      // A gap wider than the line is tall is another column, not a space between words.
      if (last && box.left - last.right <= last.bottom - last.top) {
        last.right = Math.max(last.right, box.right);
        last.top = Math.min(last.top, box.top);
        last.bottom = Math.max(last.bottom, box.bottom);
      } else {
        merged.push({ ...box });
      }
    }
    return merged;
  });
};

// The selection inside the viewer as the reader stores it: its text and its boxes on the page it starts on,
// in pixels of that page at the current zoom. Null when nothing in the viewer is selected.
export const readSelection = (selection: Selection, container: HTMLElement): TextSelection | null => {
  if (selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const page = findPage(range.startContainer) ?? findPage(range.endContainer);
  const text = selection.toString().replace(/\n/g, " ").trim();
  if (!page || !text) return null;

  const bounds = page.getBoundingClientRect();
  const originX = bounds.left + page.clientLeft;
  const originY = bounds.top + page.clientTop;
  const boxes = getTextRects(range)
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      left: rect.left - originX,
      top: rect.top - originY,
      right: rect.right - originX,
      bottom: rect.bottom - originY,
    }))
    // Keeps the boxes on this page; a selection running into the next one is cut at the page's end.
    .filter((box) => {
      const centerX = (box.left + box.right) / 2;
      const centerY = (box.top + box.bottom) / 2;
      return centerX >= 0 && centerX <= page.clientWidth && centerY >= 0 && centerY <= page.clientHeight;
    });
  if (boxes.length === 0) return null;

  const rects: SelectionRect[] = mergeByLine(boxes).map((box) => ({
    left: box.left,
    top: box.top,
    width: box.right - box.left,
    height: box.bottom - box.top,
    pageWidth: page.clientWidth,
    pageHeight: page.clientHeight,
  }));
  return { text, rects, pageNumber: Number(page.dataset.pageNumber) };
};
