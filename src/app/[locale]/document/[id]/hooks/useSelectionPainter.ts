import { useEffect } from "react";
import type { PdfViewerHandle } from "@/app/[locale]/document/[id]/hooks/useRegionOverlays";
import { type Box, readSelectionBoxes } from "@/app/[locale]/document/[id]/lib/selection-geometry";

const LAYER_CLASS = "selection-layer";

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

// Percentages of the page, so the paint follows it while the zoom changes.
const createPart = (box: Box, page: HTMLElement): HTMLElement => {
  const part = document.createElement("div");
  part.className = "selection-part";
  part.style.left = toPercent(box.left, page.clientWidth);
  part.style.top = toPercent(box.top, page.clientHeight);
  part.style.width = toPercent(box.right - box.left, page.clientWidth);
  part.style.height = toPercent(box.bottom - box.top, page.clientHeight);
  return part;
};

// Paints the text selection itself, one box per line, as it changes. The browser's own paint (a box per
// pdf.js span, with gaps between words and lines) is hidden in globals.css; the selection stays native.
export const useSelectionPainter = (viewer: PdfViewerHandle | null) => {
  useEffect(() => {
    if (!viewer) return;
    const { container, eventBus } = viewer;
    let frame = 0;

    const paint = () => {
      const selection = document.getSelection();
      const pages = selection ? readSelectionBoxes(selection, container) : new Map<HTMLElement, Box[]>();

      container.querySelectorAll<HTMLElement>(`.${LAYER_CLASS}`).forEach((layer) => {
        if (!layer.parentElement || !pages.has(layer.parentElement)) layer.remove();
      });
      pages.forEach((boxes, page) => {
        let layer = page.querySelector<HTMLElement>(`:scope > .${LAYER_CLASS}`);
        if (!layer) {
          layer = document.createElement("div");
          layer.className = LAYER_CLASS;
          page.appendChild(layer);
        }
        layer.replaceChildren(...boxes.map((box) => createPart(box, page)));
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };

    document.addEventListener("selectionchange", schedule);
    // pdf.js empties a page when it redraws it, which takes the paint with it.
    eventBus.on("pagerendered", schedule);
    eventBus.on("scalechanging", schedule);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", schedule);
      eventBus.off("pagerendered", schedule);
      eventBus.off("scalechanging", schedule);
      container.querySelectorAll(`.${LAYER_CLASS}`).forEach((layer) => layer.remove());
    };
  }, [viewer]);
};
