import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfjs } from "@/app/[locale]/document/[id]/lib/pdfjs";

// The PDF at a URL, or null while it loads; closed when the URL changes or the reader goes away.
export const usePdfDocument = (url: string): PDFDocumentProxy | null => {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    let close: (() => void) | undefined;

    loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return;
        const task = pdfjs.getDocument({ url });
        close = () => void task.destroy();
        return task.promise.then((loaded) => {
          if (!cancelled) setPdfDocument(loaded);
        });
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to load the PDF", error);
      });

    return () => {
      cancelled = true;
      close?.();
      setPdfDocument(null);
    };
  }, [url]);

  return pdfDocument;
};
