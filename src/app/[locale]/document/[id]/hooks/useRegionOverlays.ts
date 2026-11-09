import { useCallback, useEffect, useRef } from "react";
import {
  type DocumentRegion,
  type RegionKind,
  findPageElement,
  placeOnPage,
  toPageRegion,
} from "@/app/[locale]/document/[id]/lib/page-regions";

// The parts of the pdf.js viewer this hook touches.
export interface PdfViewerHandle {
  container: HTMLElement;
  eventBus: { on: (event: string, handler: () => void) => void; off: (event: string, handler: () => void) => void };
}

export interface RegionOverlayLabels {
  explain: string;
  explainAria: Record<RegionKind, string>;
  teachAria: Record<RegionKind, string>;
  enlargeAria: Record<RegionKind, string>;
}

interface UseRegionOverlaysOptions {
  viewer: PdfViewerHandle | null;
  regions: DocumentRegion[];
  enabled: boolean;
  labels: RegionOverlayLabels;
  onExplain: (region: DocumentRegion) => void;
  onTeach: (region: DocumentRegion) => void;
  onEnlarge: (region: DocumentRegion) => void;
}

// lucide's Lightbulb, GraduationCap and Maximize2; the overlay is plain DOM because pdf.js clears its pages' content on re-render.
const LIGHTBULB_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
const GRADUATION_CAP_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>';
const MAXIMIZE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>';

const OVERLAY_SELECTOR = ".region-overlay";
// Space between a box and its buttons (.region-overlay__actions in globals.css).
const BUTTON_GAP_PX = 6;

const createButton = (icon: string, ariaLabel: string, onClick: () => void, text?: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "region-overlay__action";
  button.setAttribute("aria-label", ariaLabel);
  button.title = ariaLabel;
  button.innerHTML = icon;
  if (text) button.append(text);
  button.addEventListener("mousedown", (event) => event.stopPropagation());
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
};

// Draws the detected regions over their pages and shows their actions on the one under the
// pointer. Hover is tracked by position because the boxes let the pointer through to the text.
export const useRegionOverlays = ({ viewer, regions, enabled, labels, onExplain, onTeach, onEnlarge }: UseRegionOverlaysOptions) => {
  const callbacksRef = useRef({ onExplain, onTeach, onEnlarge });
  useEffect(() => {
    callbacksRef.current = { onExplain, onTeach, onEnlarge };
  }, [onExplain, onTeach, onEnlarge]);

  const apply = useCallback(() => {
    const container = viewer?.container;
    if (!container) return;
    container.querySelectorAll(OVERLAY_SELECTOR).forEach((overlay) => overlay.remove());
    if (!enabled) return;

    for (const region of regions) {
      const page = findPageElement(container, region.pageNumber);
      if (!page) continue;
      const overlay = document.createElement("div");
      overlay.className = "region-overlay";
      placeOnPage(overlay, toPageRegion(region));

      const actions = document.createElement("div");
      actions.className = "region-overlay__actions";
      actions.append(
        createButton(LIGHTBULB_SVG, labels.explainAria[region.kind], () => callbacksRef.current.onExplain(region), labels.explain),
        createButton(GRADUATION_CAP_SVG, labels.teachAria[region.kind], () => callbacksRef.current.onTeach(region)),
        createButton(MAXIMIZE_SVG, labels.enlargeAria[region.kind], () => callbacksRef.current.onEnlarge(region))
      );

      overlay.appendChild(actions);
      page.appendChild(overlay);
    }
  }, [viewer, regions, enabled, labels]);

  // pdf.js empties a page when it re-renders it (zoom, scrolling far away), so overlays are redrawn.
  useEffect(() => {
    apply();
    if (!viewer) return;
    viewer.eventBus.on("pagerendered", apply);
    return () => viewer.eventBus.off("pagerendered", apply);
  }, [apply, viewer]);

  useEffect(() => {
    const container = viewer?.container;
    if (!container || !enabled) return;
    let frame = 0;

    const setActive = (x: number, y: number) => {
      container.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach((overlay) => {
        const box = overlay.getBoundingClientRect();
        const actions = overlay.firstElementChild?.getBoundingClientRect();
        // The margin bridges the gap between the box and the buttons floating above it.
        const inside = (rect: DOMRect | undefined, margin = 0) =>
          !!rect && x >= rect.left && x <= rect.right && y >= rect.top - margin && y <= rect.bottom;
        overlay.dataset.active = String(inside(box, BUTTON_GAP_PX) || inside(actions));
      });
    };
    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(event.clientX, event.clientY));
    };
    const handleLeave = () => {
      cancelAnimationFrame(frame);
      setActive(Number.NaN, Number.NaN);
    };

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, [viewer, enabled, regions]);
};
