import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import { loadPdfjsViewer } from "@/app/[locale]/document/[id]/lib/pdfjs";

// pdf.js TextLayerMode.ENABLE_PERMISSIONS: selectable text that honours the PDF's copy permissions.
const TEXT_LAYER_MODE = 2;

interface UsePdfViewerOptions {
  // pdf.js needs it absolutely positioned, with an empty div as its first child.
  container: HTMLDivElement | null;
  pdfDocument: PDFDocumentProxy | null;
  scale: number;
  // Page to open on once pdf.js has laid out the pages; onReady fires after that.
  initialPage?: number;
  onPageChange: (page: number) => void;
  onReady?: () => void;
}

// The pdf.js viewer drawing a document into the container; null until both exist.
export const usePdfViewer = ({ container, pdfDocument, scale, initialPage, onPageChange, onReady }: UsePdfViewerOptions): PDFViewer | null => {
  const [viewer, setViewer] = useState<PDFViewer | null>(null);
  const latest = useRef({ scale, initialPage, onPageChange, onReady });
  useEffect(() => {
    latest.current = { scale, initialPage, onPageChange, onReady };
  });

  useEffect(() => {
    if (!container || !pdfDocument) return;
    let cancelled = false;
    let close: (() => void) | undefined;

    loadPdfjsViewer().then(({ EventBus, LinkTarget, PDFLinkService, PDFViewer }) => {
      if (cancelled) return;
      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus, externalLinkTarget: LinkTarget.BLANK });
      const instance = new PDFViewer({ container, eventBus, linkService, textLayerMode: TEXT_LAYER_MODE, removePageBorders: true });
      linkService.setViewer(instance);

      eventBus.on("pagechanging", (event: { pageNumber: number }) => latest.current.onPageChange(event.pageNumber));
      eventBus.on(
        "pagesinit",
        () => {
          instance.currentScaleValue = String(latest.current.scale);
          const page = latest.current.initialPage;
          if (page && page > 1 && page <= instance.pagesCount) instance.currentPageNumber = page;
          latest.current.onReady?.();
        },
        { once: true }
      );

      instance.setDocument(pdfDocument);
      linkService.setDocument(pdfDocument);
      close = () => {
        // pdf.js takes null to close the document and empty its pages; its types don't say so.
        instance.setDocument(null as unknown as PDFDocumentProxy);
        linkService.setDocument(null);
      };
      setViewer(instance);
    });

    return () => {
      cancelled = true;
      close?.();
      setViewer(null);
    };
  }, [container, pdfDocument]);

  useEffect(() => {
    if (viewer) viewer.currentScaleValue = String(scale);
  }, [viewer, scale]);

  return viewer;
};
