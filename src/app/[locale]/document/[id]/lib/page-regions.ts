import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// GET /documents/:id/regions. The box is in fractions of the page, like PageRegion.
export type RegionKind = "table" | "image" | "figure" | "formula";

export interface DocumentRegion {
  id: string;
  pageNumber: number;
  kind: RegionKind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const toPageRegion = (region: DocumentRegion): PageRegion => ({
  pageNumber: region.pageNumber,
  left: region.x0,
  top: region.y0,
  width: region.x1 - region.x0,
  height: region.y1 - region.y0,
});

// Percentages of the pdf.js page element, so the box follows the page at any zoom.
export const placeOnPage = (element: HTMLElement, region: PageRegion): void => {
  element.style.left = `${region.left * 100}%`;
  element.style.top = `${region.top * 100}%`;
  element.style.width = `${region.width * 100}%`;
  element.style.height = `${region.height * 100}%`;
};

export const findPageElement = (container: Element, pageNumber: number): HTMLElement | null =>
  container.querySelector<HTMLElement>(`.page[data-page-number="${pageNumber}"]`);

const FLASH_MS = 1400;

interface PdfViewerLike {
  container: Element;
  eventBus: { on: (event: string, handler: (event: { pageNumber: number }) => void) => void; off: (event: string, handler: (event: { pageNumber: number }) => void) => void };
}

// Centres a region on screen and outlines it briefly. pdf.js may draw the page as it scrolls in,
// which clears it, so the outline is added again once that page has drawn.
export const flashRegion = (viewer: PdfViewerLike, region: PageRegion): void => {
  const show = (scroll: boolean) => {
    const page = findPageElement(viewer.container, region.pageNumber);
    if (!page) return null;
    const outline = document.createElement("div");
    outline.className = "region-flash";
    outline.setAttribute("aria-hidden", "true");
    placeOnPage(outline, region);
    page.appendChild(outline);
    if (scroll) outline.scrollIntoView({ block: "center" });
    setTimeout(() => outline.remove(), FLASH_MS);
    return outline;
  };

  let outline = show(true);
  const onRendered = (event: { pageNumber: number }) => {
    if (event.pageNumber !== region.pageNumber) return;
    viewer.eventBus.off("pagerendered", onRendered);
    if (!outline?.isConnected) outline = show(false);
  };
  viewer.eventBus.on("pagerendered", onRendered);
  setTimeout(() => viewer.eventBus.off("pagerendered", onRendered), FLASH_MS);
};

// Removes an anchor made by createRegionAnchor once nothing is anchored to it; other targets are left alone.
export const releaseRegionAnchor = (target: unknown): void => {
  if (target instanceof HTMLElement && target.classList.contains("region-anchor")) target.remove();
};

// An invisible box over the region for the explanation card to anchor to; it scrolls with the page.
export const createRegionAnchor = (container: Element, region: PageRegion): HTMLElement | null => {
  const page = findPageElement(container, region.pageNumber);
  if (!page) return null;
  const anchor = document.createElement("div");
  anchor.className = "region-anchor";
  anchor.setAttribute("aria-hidden", "true");
  placeOnPage(anchor, region);
  page.appendChild(anchor);
  return anchor;
};
