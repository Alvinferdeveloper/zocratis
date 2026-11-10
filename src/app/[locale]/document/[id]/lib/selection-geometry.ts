import type { SelectionRect, TextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";

// A rectangle in pixels of its page at the current zoom.
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const getHeight = (box: Box) => box.bottom - box.top;

// The part of a text node the range covers, as wide as the covered text and as tall as its pdf.js span.
const getNodeRect = (node: Text, span: Element, range: Range): { left: number; right: number; top: number; bottom: number } | null => {
  const line = span.getBoundingClientRect();
  if (line.width === 0 || line.height === 0) return null;
  if (node !== range.startContainer && node !== range.endContainer) return line;

  const part = document.createRange();
  part.setStart(node, node === range.startContainer ? range.startOffset : 0);
  part.setEnd(node, node === range.endContainer ? range.endOffset : node.length);
  const covered = part.getBoundingClientRect();
  return covered.width === 0 ? null : { left: covered.left, right: covered.right, top: line.top, bottom: line.bottom };
};

// The selected text's boxes on each page. Only text layers count: a range's own rects also include
// pdf.js's helper elements and anything else inside the viewer.
const collectBoxes = (range: Range): Map<HTMLElement, Box[]> => {
  const pages = new Map<HTMLElement, Box[]>();
  const origins = new Map<HTMLElement, { x: number; y: number }>();
  const root = range.commonAncestorContainer;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  // A walker never returns its own root, which is the whole selection when it sits inside one text node.
  for (let node = root instanceof Text ? root : walker.nextNode(); node; node = walker.nextNode()) {
    const span = node.parentElement;
    const page = span?.closest(".textLayer")?.closest<HTMLElement>(".page");
    if (!span || !page || !range.intersectsNode(node)) continue;
    const rect = getNodeRect(node as Text, span, range);
    if (!rect) continue;

    let origin = origins.get(page);
    if (!origin) {
      const bounds = page.getBoundingClientRect();
      origins.set(page, (origin = { x: bounds.left + page.clientLeft, y: bounds.top + page.clientTop }));
    }
    const box = { left: rect.left - origin.x, top: rect.top - origin.y, right: rect.right - origin.x, bottom: rect.bottom - origin.y };
    const boxes = pages.get(page);
    if (boxes) boxes.push(box);
    else pages.set(page, [box]);
  }
  return pages;
};

// Two boxes share a line when they overlap vertically by more than half of the shorter one.
const onSameLine = (a: Box, b: Box): boolean =>
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(getHeight(a), getHeight(b)) / 2;

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
      if (last && box.left - last.right <= getHeight(last)) {
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

// Room around the text, in line heights: a span's box is as tight as its font size, which clips
// descenders, accents and the last letter's overhang.
const PAD_X_RATIO = 0.2;
const PAD_Y_RATIO = 0.15;
// Line ends this close to their paragraph's edge (in line heights) snap to it; a short last line stays short.
const SNAP_RATIO = 3;

// The line under this one in its column, when it's close enough to belong to the same paragraph.
const findNextLine = (line: Box, lines: Box[]): Box | undefined =>
  lines.find(
    (below) => below.top > line.top && below.left < line.right && below.right > line.left && below.top - line.bottom < getHeight(line)
  );

// Evens out the ragged edges of a paragraph: lines that are fully selected reach the edges of their neighbours.
const snapToNeighbours = (lines: Box[]): void => {
  const nextOf = new Map(lines.map((line): [Box, Box | undefined] => [line, findNextLine(line, lines)]));
  const previousOf = new Map<Box, Box>();
  nextOf.forEach((next, line) => next && previousOf.set(next, line));

  const snapped = lines.map((line) => {
    const next = nextOf.get(line);
    const previous = previousOf.get(line);
    const reach = getHeight(line) * SNAP_RATIO;
    // A line with one above it is selected from its start, and one with a line below it up to its end.
    const left = previous ? Math.min(previous.left, next?.left ?? Infinity) : line.left;
    const right = next ? Math.max(next.right, previous?.right ?? -Infinity) : line.right;
    return {
      left: left < line.left && line.left - left <= reach ? left : line.left,
      right: right > line.right && right - line.right <= reach ? right : line.right,
    };
  });
  lines.forEach((line, index) => Object.assign(line, snapped[index]));
};

// Pads every line and stretches it down to the next one, so a paragraph reads as one block without stripes.
const padAndCloseGaps = (lines: Box[]): Box[] => {
  const padded = lines.map((line) => {
    const height = getHeight(line);
    return {
      left: line.left - height * PAD_X_RATIO,
      right: line.right + height * PAD_X_RATIO,
      top: line.top - height * PAD_Y_RATIO,
      bottom: line.bottom + height * PAD_Y_RATIO,
    };
  });
  padded.forEach((line) => {
    const next = findNextLine(line, padded);
    if (next && next.top > line.bottom) line.bottom = next.top;
  });
  return padded;
};

// Boxes may overlap after this; they are drawn as one shape, so overlaps don't show.
const shapeLines = (boxes: Box[]): Box[] => {
  const lines = mergeByLine(boxes).sort((a, b) => a.top - b.top);
  snapToNeighbours(lines);
  return padAndCloseGaps(lines);
};

// The selection's boxes, one per line, on each page it touches. Empty when nothing in the viewer is selected.
export const readSelectionBoxes = (selection: Selection, container: HTMLElement): Map<HTMLElement, Box[]> => {
  if (selection.isCollapsed || selection.rangeCount === 0) return new Map();
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return new Map();

  const pages = collectBoxes(range);
  pages.forEach((boxes, page) => pages.set(page, shapeLines(boxes)));
  return pages;
};

// The selection as the reader stores it: its text and its boxes on the page it starts on, in pixels of
// that page at the current zoom. Null when nothing in the viewer is selected.
export const readSelection = (selection: Selection, container: HTMLElement): TextSelection | null => {
  const text = selection.toString().replace(/\n/g, " ").trim();
  const [first] = readSelectionBoxes(selection, container);
  if (!text || !first) return null;

  const [page, boxes] = first;
  const rects: SelectionRect[] = boxes.map((box) => ({
    left: box.left,
    top: box.top,
    width: box.right - box.left,
    height: getHeight(box),
    pageWidth: page.clientWidth,
    pageHeight: page.clientHeight,
  }));
  return { text, rects, pageNumber: Number(page.dataset.pageNumber) };
};
