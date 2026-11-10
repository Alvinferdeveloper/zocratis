import { useEffect } from "react";
import type { PdfViewerHandle } from "@/app/[locale]/document/[id]/hooks/useRegionOverlays";
import { type Box, readSelectionBoxes } from "@/app/[locale]/document/[id]/lib/selection-geometry";

const LAYER_CLASS = "selection-layer";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// One path for the whole page: where line boxes overlap, the color is painted once instead of twice.
const toShape = (boxes: Box[]): string =>
  boxes.map((box) => `M${box.left} ${box.top}H${box.right}V${box.bottom}H${box.left}Z`).join("");

const createLayer = (page: HTMLElement): SVGSVGElement => {
  const layer = document.createElementNS(SVG_NAMESPACE, "svg");
  layer.setAttribute("class", LAYER_CLASS);
  layer.setAttribute("preserveAspectRatio", "none");
  layer.setAttribute("aria-hidden", "true");
  layer.appendChild(document.createElementNS(SVG_NAMESPACE, "path"));
  page.appendChild(layer);
  return layer;
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

      container.querySelectorAll(`.${LAYER_CLASS}`).forEach((layer) => {
        if (!(layer.parentElement instanceof HTMLElement) || !pages.has(layer.parentElement)) layer.remove();
      });
      pages.forEach((boxes, page) => {
        const layer = page.querySelector<SVGSVGElement>(`:scope > .${LAYER_CLASS}`) ?? createLayer(page);
        // The boxes are in pixels of the page as it is now; stretched over it, they follow the zoom.
        layer.setAttribute("viewBox", `0 0 ${page.clientWidth} ${page.clientHeight}`);
        layer.firstElementChild?.setAttribute("d", toShape(boxes));
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
