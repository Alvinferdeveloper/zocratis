import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";

// CSS width of a thumbnail; rendered at twice that so it stays sharp on high-density screens.
export const THUMBNAIL_WIDTH = 112;
const RENDER_SCALE = 2;

// Per document, so a reopened sidebar is instant; dropped with the document.
const cache = new WeakMap<PdfDocument, Map<number, Promise<string>>>();
// One render at a time, so thumbnails don't compete with the main viewer for the pdf.js worker.
let queue: Promise<unknown> = Promise.resolve();

const render = async (pdf: PdfDocument, pageNumber: number): Promise<string> => {
  const page = await pdf.getPage(pageNumber);
  const { width } = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: (THUMBNAIL_WIDTH * RENDER_SCALE) / width });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;

  // A data URL (not an object URL) is freed with the cache, with nothing to revoke.
  return canvas.toDataURL("image/jpeg", 0.85);
};

// Image URL of a page's thumbnail, rendered once per document.
export const getPageThumbnail = (pdf: PdfDocument, pageNumber: number): Promise<string> => {
  let pages = cache.get(pdf);
  if (!pages) cache.set(pdf, (pages = new Map()));

  const cached = pages.get(pageNumber);
  if (cached) return cached;

  const thumbnail = queue.then(() => render(pdf, pageNumber));
  queue = thumbnail.catch(() => undefined);
  // A failed render isn't cached, so the page can be tried again.
  thumbnail.catch(() => pages.delete(pageNumber));
  pages.set(pageNumber, thumbnail);
  return thumbnail;
};
