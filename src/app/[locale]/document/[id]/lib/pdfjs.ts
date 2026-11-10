type PdfjsLib = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfjsViewer = typeof import("pdfjs-dist/legacy/web/pdf_viewer.mjs");

let pdfjs: Promise<PdfjsLib> | null = null;

// Loaded on demand because pdf.js needs the DOM; the legacy build keeps Safari 16.4 and Chrome 118 working.
export const loadPdfjs = (): Promise<PdfjsLib> =>
  (pdfjs ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
    // Bundled from the package, so the worker can't drift from the library's version.
    lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return lib;
  }));

// The viewer module reads the library from globalThis.pdfjsLib, which loading the library sets.
export const loadPdfjsViewer = async (): Promise<PdfjsViewer> => {
  await loadPdfjs();
  return import("pdfjs-dist/legacy/web/pdf_viewer.mjs");
};
