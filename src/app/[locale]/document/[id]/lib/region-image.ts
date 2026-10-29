import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";

// A rectangle on a page as fractions of the page (0–1), so it doesn't depend on the zoom it was drawn at.
export interface PageRegion {
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RegionCapture {
  // JPEG data URL of the region, drawn from the PDF itself.
  image: string;
  // Text pdf.js finds inside the region; empty on scanned pages.
  text: string;
}

// Longest side of the image: small subscripts stay legible to a vision model, without huge uploads.
const TARGET_SIZE_PX = 1600;
const MAX_SCALE = 6;
// JPEG keeps text crisp at this quality and is several times lighter than PNG to upload.
const JPEG_QUALITY = 0.92;

type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

// Redraws only the region at high resolution, instead of screenshotting the on-screen canvas.
const renderRegion = async (page: PdfPage, region: PageRegion): Promise<string> => {
  const baseViewport = page.getViewport({ scale: 1 });
  const longestSide = Math.max(baseViewport.width * region.width, baseViewport.height * region.height);
  const scale = Math.min(MAX_SCALE, TARGET_SIZE_PX / longestSide);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width * region.width));
  canvas.height = Math.max(1, Math.round(viewport.height * region.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  await page.render({
    canvasContext: context,
    viewport,
    // Shifts the page so the region lands at the canvas origin; the rest is clipped.
    transform: [1, 0, 0, 1, -region.left * viewport.width, -region.top * viewport.height],
  }).promise;
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
};

// Text items whose centre falls inside the region, in reading order.
const extractRegionText = async (page: PdfPage, region: PageRegion): Promise<string> => {
  const viewport = page.getViewport({ scale: 1 });
  const left = region.left * viewport.width;
  const top = region.top * viewport.height;
  const right = left + region.width * viewport.width;
  const bottom = top + region.height * viewport.height;

  const { items } = await page.getTextContent();
  let text = "";
  for (const item of items) {
    if (!("str" in item) || !item.str) continue;
    const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    const centerX = x + item.width / 2;
    const centerY = y - item.height / 2;
    if (centerX < left || centerX > right || centerY < top || centerY > bottom) continue;
    text += item.str + (item.hasEOL ? "\n" : " ");
  }
  return text.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
};

export const captureRegion = async (pdf: PdfDocument, region: PageRegion): Promise<RegionCapture> => {
  const page = await pdf.getPage(region.pageNumber);
  const [image, text] = await Promise.all([renderRegion(page, region), extractRegionText(page, region)]);
  return { image, text };
};
