"use client";

import { useRef, useMemo, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { useTranslations } from "next-intl";
import { PdfLoader, PdfHighlighter, TextHighlight, useHighlightContainerContext, ViewportHighlight } from "react-pdf-highlighter-extended";
import "react-pdf-highlighter-extended/dist/esm/style/PdfHighlighter.css";
import "react-pdf-highlighter-extended/dist/esm/style/pdf_viewer.css";
import { AnnotationRect, BoundingRect } from "@/app/types";
import { usePdfPageOverlay } from "../../hooks/usePdfPageOverlay";
import { PdfSkeleton } from "./PdfSkeleton";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import { createRegionAnchor, type DocumentRegion, flashRegion, toPageRegion } from "@/app/[locale]/document/[id]/lib/page-regions";
import { type PdfViewerHandle, useRegionOverlays } from "@/app/[locale]/document/[id]/hooks/useRegionOverlays";
import type { PdfDestination } from "@/app/[locale]/document/[id]/lib/pdf-outline";
import { clearSearchHighlight, findTextLayerRange, showSearchHighlight } from "@/app/[locale]/document/[id]/lib/text-layer-highlight";

// Lets the reader move the viewer from outside it (the sidebar's pages, notes and vocabulary).
export interface PdfNavigation {
    // With a destination (from the outline), lands on that spot of the page instead of its top.
    goToPage: (pageNumber: number, destination?: PdfDestination) => void;
    // Scrolls to a highlight and flashes it; false when it isn't rendered (e.g. the other mode's highlights).
    scrollToHighlight: (id: string) => boolean;
    // Jumps to the page and highlights the nth match of the text there (exact search, semantic passages).
    showTextMatch: (pageNumber: number, query: string, occurrence: number) => void;
    clearTextMatch: () => void;
    // Scrolls to a region of a page and flashes it (the figure a chat message was about).
    showRegion: (region: PageRegion) => void;
    // An invisible box over a region for a popover to anchor to; null if its page isn't laid out.
    createRegionAnchor: (region: PageRegion) => HTMLElement | null;
}

const NO_REGIONS: DocumentRegion[] = [];

export interface PdfHighlightItem {
    id: string;
    color: string;
    // An explained passage: underlined in ink instead of filled with the note color.
    variant?: "explanation";
    selectedText: string;
    pageNumber: number;
    boundingRect: BoundingRect;
    rects: AnnotationRect[];
}

interface PdfViewerProps {
    publicUrl: string;
    scale: number;
    highlights: PdfHighlightItem[];
    selectionTip: React.ReactNode;
    onTextSelection: (selection: { text: string; rects: { top: number; left: number; width: number; height: number; pageWidth?: number; pageHeight?: number }[]; pageNumber: number }) => void;
    onPageChange: (page: number) => void;
    onHighlightClick: (id: string, anchor: Element) => void;
    setNumPages: (numPages: number) => void;
    examMode?: boolean;
    selectedPages?: number[];
    onPageSelect?: (page: number) => void;
    onPdfLoad?: (pdfDoc: PdfDocument) => void;
    navigationRef?: React.Ref<PdfNavigation>;
    regionMode?: boolean;
    // The anchor is an invisible box over the region for the explanation card; null if the page is gone.
    onRegionSelection?: (region: PageRegion, anchor: HTMLElement | null) => void;
    // Regions the parser found, highlighted on hover with an "Explain" button.
    regions?: DocumentRegion[];
    onRegionExplain?: (region: DocumentRegion, anchor: HTMLElement | null) => void;
    onRegionEnlarge?: (region: DocumentRegion) => void;
    viewportRef?: React.Ref<HTMLDivElement>;
    // Page to open on once pdf.js has laid out the pages; onReady fires after that, or right away without one.
    initialPage?: number;
    onReady?: () => void;
}

interface SelectionEvent {
    type?: "text" | "area";
    content?: { text?: string };
    position?: {
        boundingRect: { x1: number; y1: number; x2: number; y2: number; width: number; height: number; pageNumber: number };
        rects?: Array<{ x1: number; y1: number; x2: number; y2: number; width: number; height: number }>;
    };
}

interface HighlightRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
}

// scrollToHighlight leaves the highlight this far from the top, under the floating controls.
const LIBRARY_SCROLL_MARGIN = 10;
// Room for the floating page and zoom controls above the highlight.
const MIN_TOP_CLEARANCE = 88;

// Scrolls so a box of this height, now `currentTop` px below the viewer's top, sits in the middle (never under the controls).
const scrollToMiddle = (container: HTMLElement, currentTop: number, height: number) => {
    const target = Math.max(MIN_TOP_CLEARANCE, (container.clientHeight - height) / 2);
    container.scrollTop += currentTop - target;
};

// Moves the highlight the library just scrolled to into the middle of the viewer. Synchronous on purpose:
// the library only starts listening for scroll (which clears the flash) 100ms after its own jump.
const centerScrolledHighlight = (viewer: any, rect: { y1: number; y2: number; height: number; pageNumber: number }) => {
    const viewport = viewer?.getPageView(rect.pageNumber - 1)?.viewport;
    if (!viewport) return;
    scrollToMiddle(viewer.container, LIBRARY_SCROLL_MARGIN, ((rect.y2 - rect.y1) * viewport.height) / rect.height);
};

// pdf.js draws a page's text layer only once the page is near the view.
const TEXT_LAYER_TIMEOUT_MS = 3000;
const waitForTextLayer = (viewer: any, pageNumber: number): Promise<Element | null> =>
    new Promise((resolve) => {
        const find = (): Element | null =>
            viewer.container.querySelector(`.page[data-page-number="${pageNumber}"] .textLayer`);
        const ready = find();
        if (ready?.childElementCount) return resolve(ready);
        const onRendered = (event: { pageNumber: number }) => {
            if (event.pageNumber !== pageNumber) return;
            stop();
            resolve(find());
        };
        const timeout = setTimeout(() => {
            stop();
            resolve(null);
        }, TEXT_LAYER_TIMEOUT_MS);
        const stop = () => {
            viewer.eventBus.off("textlayerrendered", onRendered);
            clearTimeout(timeout);
        };
        viewer.eventBus.on("textlayerrendered", onRendered);
    });

// Only .TextHighlight__part elements have a real box, and the click target isn't always one, so pick by position.
const getClickedPart = (container: Element, x: number, y: number): Element => {
    const parts = Array.from(container.querySelectorAll(".TextHighlight__part"));
    const hit = parts.find((part) => {
        const rect = part.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    return hit ?? parts[0] ?? container;
};

const HighlightContainer = ({ onClick }: { onClick: (highlight: ViewportHighlight, anchor: Element) => void }) => {
    const { highlight, isScrolledTo } = useHighlightContainerContext();
    const highlightWithColor = highlight as ViewportHighlight & { color?: string; variant?: "explanation" };
    const style =
        highlightWithColor.variant === "explanation"
            ? { background: "transparent", borderBottom: "1.5px dotted var(--primary)" }
            : { background: highlightWithColor.color };

    return (
        <div onClick={(e) => onClick(highlight, getClickedPart(e.currentTarget, e.clientX, e.clientY))}>
            <TextHighlight isScrolledTo={isScrolledTo} highlight={highlight} style={style} />
        </div>
    );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
    publicUrl,
    highlights: highlightItems,
    scale,
    setNumPages,
    selectionTip,
    onPageChange,
    onTextSelection,
    onHighlightClick,
    examMode = false,
    selectedPages = [],
    onPageSelect,
    onPdfLoad,
    navigationRef,
    regionMode = false,
    onRegionSelection,
    regions = NO_REGIONS,
    onRegionExplain,
    onRegionEnlarge,
    viewportRef,
    initialPage,
    onReady,
}) => {
    const utilsRef = useRef<any>(null);
    const numPagesRef = useRef<number | null>(null);
    const eventBusAttachedRef = useRef(false);
    const onPageChangeRef = useRef(onPageChange);
    const initialPageRef = useRef(initialPage);
    const onReadyRef = useRef(onReady);
    const textMatchRequestRef = useRef(0);

    const { setUtils } = usePdfPageOverlay({
        examMode,
        selectedPages,
        onPageSelect,
    });

    // The pdf.js viewer as state, so the region overlays draw once it exists.
    const [viewer, setViewer] = useState<PdfViewerHandle | null>(null);
    const tRegions = useTranslations("reader.regions");
    const regionLabels = useMemo(
        () => ({
            explain: tRegions("explain"),
            explainAria: {
                table: tRegions("explainTable"),
                image: tRegions("explainImage"),
                figure: tRegions("explainFigure"),
                formula: tRegions("explainFormula"),
            },
            enlargeAria: {
                table: tRegions("enlarge", { kind: "table" }),
                image: tRegions("enlarge", { kind: "image" }),
                figure: tRegions("enlarge", { kind: "figure" }),
                formula: tRegions("enlarge", { kind: "formula" }),
            },
        }),
        [tRegions]
    );
    useRegionOverlays({
        viewer,
        regions,
        enabled: !examMode && Boolean(onRegionExplain),
        labels: regionLabels,
        // Overlays are redrawn too often to anchor to, so the card gets its own box.
        onExplain: (region) =>
            onRegionExplain?.(region, viewer ? createRegionAnchor(viewer.container, toPageRegion(region)) : null),
        onEnlarge: (region) => onRegionEnlarge?.(region),
    });

    useEffect(() => {
        onPageChangeRef.current = onPageChange;
        onReadyRef.current = onReady;
    }, [onPageChange, onReady]);

    useImperativeHandle(navigationRef, () => ({
        goToPage: (pageNumber, destination) => {
            const viewer = utilsRef.current?.getViewer();
            if (!viewer) return;
            viewer.scrollPageIntoView({ pageNumber, destArray: destination });
            // pdf.js puts the destination at the very top, under the floating controls.
            if (destination) viewer.container.scrollTop -= MIN_TOP_CLEARANCE;
        },
        createRegionAnchor: (region) => {
            const container = utilsRef.current?.getViewer()?.container;
            return container ? createRegionAnchor(container, region) : null;
        },
        showRegion: (region) => {
            const viewer = utilsRef.current?.getViewer();
            if (!viewer) return;
            viewer.scrollPageIntoView({ pageNumber: region.pageNumber });
            flashRegion(viewer, region);
        },
        scrollToHighlight: (id) => {
            const highlight = highlightsRef.current.find((item) => item.id === id);
            const utils = utilsRef.current;
            if (!highlight || !utils) return false;
            utils.scrollToHighlight(highlight);
            centerScrolledHighlight(utils.getViewer(), highlight.position.boundingRect);
            return true;
        },
        showTextMatch: async (pageNumber, query, occurrence) => {
            const viewer = utilsRef.current?.getViewer();
            if (!viewer) return;
            const request = ++textMatchRequestRef.current;
            clearSearchHighlight();
            viewer.scrollPageIntoView({ pageNumber });
            const layer = await waitForTextLayer(viewer, pageNumber);
            // A newer search result was picked while this page was being drawn.
            if (!layer || request !== textMatchRequestRef.current) return;
            const range = findTextLayerRange(layer, query, occurrence);
            if (!range) return;
            showSearchHighlight(range);
            const box = range.getBoundingClientRect();
            scrollToMiddle(viewer.container, box.top - viewer.container.getBoundingClientRect().top, box.height);
        },
        clearTextMatch: () => {
            textMatchRequestRef.current += 1;
            clearSearchHighlight();
        },
    }), []);

    useEffect(() => {
        if (utilsRef.current) {
            const viewer = utilsRef.current.getViewer();
            if (viewer) {
                viewer.currentScaleValue = scale.toString();
            }
        }
    }, [scale]);

    // The library snapshots selectionTip synchronously on mouseup, before our state catches up — push fresh content into the tip once it does.
    useEffect(() => {
        const utils = utilsRef.current;
        const currentTip = utils?.getTip?.();
        if (currentTip) {
            utils.setTip({ ...currentTip, content: selectionTip });
        }
    }, [selectionTip]);

    const highlights = useMemo(() => {
        return highlightItems.map((item) => ({
            id: item.id,
            color: item.color,
            variant: item.variant,
            content: { text: item.selectedText },
            position: {
                boundingRect: item.boundingRect,
                rects: item.rects,
                pageNumber: item.pageNumber,
            }
        }));
    }, [highlightItems]);
    const highlightsRef = useRef(highlights);
    useEffect(() => {
        highlightsRef.current = highlights;
    }, [highlights]);

    // The library keeps the first enableAreaSelection it gets, so it reads the mode through a ref.
    const regionModeRef = useRef(regionMode);
    useEffect(() => {
        regionModeRef.current = regionMode;
    }, [regionMode]);
    const enableAreaSelection = useCallback((event: MouseEvent) => regionModeRef.current || event.altKey, []);

    const handleSelection = useCallback((selection: SelectionEvent) => {
        const position = selection?.position;
        if (!position) return;

        if (selection.type === "area") {
            // In fractions of the page: the region is redrawn from the PDF, whatever the zoom.
            const { x1, y1, x2, y2, width, height, pageNumber } = position.boundingRect;
            if (onRegionSelection && width > 0 && height > 0 && x2 > x1 && y2 > y1) {
                const region = {
                    pageNumber,
                    left: x1 / width,
                    top: y1 / height,
                    width: (x2 - x1) / width,
                    height: (y2 - y1) / height,
                };
                const container = utilsRef.current?.getViewer()?.container;
                onRegionSelection(region, container ? createRegionAnchor(container, region) : null);
            }
            return;
        }

        const text = selection?.content?.text || "";
        if (text.length > 0) {
            const rects = position.rects || [position.boundingRect];
            onTextSelection({
                text,
                rects: rects.map((r: HighlightRect) => ({
                    top: r.y1,
                    left: r.x1,
                    width: r.x2 - r.x1,
                    height: r.y2 - r.y1,
                    pageWidth: r.width,
                    pageHeight: r.height,
                })),
                pageNumber: position.boundingRect.pageNumber,
            });
        }
    }, [onTextSelection, onRegionSelection]);

    return (
        // contain:paint also clips position:fixed descendants (popovers portaled here), which overflow-hidden alone doesn't.
        <div ref={viewportRef} className="flex-1 overflow-hidden bg-reader-canvas relative [contain:paint]">
            <PdfLoader
                document={publicUrl}
                beforeLoad={() => <PdfSkeleton />}
                workerSrc="https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs"
            >
                {(pdfDoc) => {
                    if (numPagesRef.current !== pdfDoc.numPages) {
                        numPagesRef.current = pdfDoc.numPages;
                        setTimeout(() => {
                            setNumPages(pdfDoc.numPages);
                            if (onPdfLoad) onPdfLoad(pdfDoc);
                        }, 0);
                    }
                    return (
                        <PdfHighlighter
                            pdfScaleValue={scale}
                            pdfDocument={pdfDoc}
                            enableAreaSelection={enableAreaSelection}
                            highlights={highlights}
                            onSelection={handleSelection}
                            selectionTip={selectionTip}
                            utilsRef={(utils) => {
                                utilsRef.current = utils;
                                setUtils(utils);
                                const viewer = utils?.getViewer();
                                // Called while the library renders: the state update waits until it ends.
                                if (viewer) queueMicrotask(() => setViewer((current) => current ?? viewer));
                                if (viewer?.eventBus && !eventBusAttachedRef.current) {
                                    eventBusAttachedRef.current = true;
                                    viewer.eventBus.on("pagechanging", (evt: { pageNumber: number }) => {
                                        onPageChangeRef.current(evt.pageNumber);
                                    });
                                    const openInitialPage = () => {
                                        const page = initialPageRef.current;
                                        if (page && page > 1 && page <= viewer.pagesCount) viewer.currentPageNumber = page;
                                        onReadyRef.current?.();
                                    };
                                    // The library calls utilsRef while rendering; the page change and onReady update the reader's state, so wait until it ends.
                                    if (viewer.pagesCount > 0) queueMicrotask(openInitialPage);
                                    else viewer.eventBus.on("pagesinit", openInitialPage, { once: true });
                                }
                            }}
                        >
                            <HighlightContainer onClick={(highlight: ViewportHighlight, anchor: Element) => {
                                onHighlightClick(highlight.id, anchor);
                            }} />
                        </PdfHighlighter>
                    );
                }}
            </PdfLoader>
        </div>
    );
};