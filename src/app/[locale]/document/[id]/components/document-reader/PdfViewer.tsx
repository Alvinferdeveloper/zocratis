"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { usePdfPageOverlay } from "../../hooks/usePdfPageOverlay";
import { PdfSkeleton } from "./PdfSkeleton";
import { HighlightLayer } from "./pdf-viewer/HighlightLayer";
import { SelectionTip } from "./pdf-viewer/SelectionTip";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import { createRegionAnchor, type DocumentRegion, findPageElement, flashRegion, toPageRegion } from "@/app/[locale]/document/[id]/lib/page-regions";
import { getHighlightSpan, type PdfHighlightItem } from "@/app/[locale]/document/[id]/lib/page-highlights";
import { useRegionOverlays } from "@/app/[locale]/document/[id]/hooks/useRegionOverlays";
import { useHighlightPointer } from "@/app/[locale]/document/[id]/hooks/useHighlightPointer";
import { usePdfDocument } from "@/app/[locale]/document/[id]/hooks/usePdfDocument";
import { usePdfSelection } from "@/app/[locale]/document/[id]/hooks/usePdfSelection";
import { usePdfViewer } from "@/app/[locale]/document/[id]/hooks/usePdfViewer";
import { useRegionCrop } from "@/app/[locale]/document/[id]/hooks/useRegionCrop";
import type { TextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import type { PdfDestination } from "@/app/[locale]/document/[id]/lib/pdf-outline";
import { clearSearchHighlight, findTextLayerRange, showSearchHighlight } from "@/app/[locale]/document/[id]/lib/text-layer-highlight";

// Lets the reader move the viewer from outside it (the sidebar's pages, notes and vocabulary).
export interface PdfNavigation {
    // With a destination (from the outline), lands on that spot of the page instead of its top.
    goToPage: (pageNumber: number, destination?: PdfDestination) => void;
    // Scrolls to a highlight and flashes it; false when it isn't drawn (e.g. the other mode's highlights).
    scrollToHighlight: (id: string) => boolean;
    // Jumps to the page and highlights the nth match of the text there (exact search, semantic passages).
    showTextMatch: (pageNumber: number, query: string, occurrence: number) => void;
    clearTextMatch: () => void;
    // Scrolls to a region of a page and flashes it (the figure a chat message was about).
    showRegion: (region: PageRegion) => void;
    // An invisible box over a region for a popover to anchor to; null if its page isn't laid out.
    createRegionAnchor: (region: PageRegion) => HTMLElement | null;
    // Brings a region back on screen and anchors to it once its page is drawn, since drawing clears it.
    returnToRegion: (region: PageRegion) => Promise<HTMLElement | null>;
}

const NO_REGIONS: DocumentRegion[] = [];

interface PdfViewerProps {
    publicUrl: string;
    scale: number;
    highlights: PdfHighlightItem[];
    // Shown over a text selection once it settles.
    selectionTip: React.ReactNode;
    onTextSelection: (selection: TextSelection) => void;
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
    onRegionTeach?: (region: DocumentRegion) => void;
    onRegionEnlarge?: (region: DocumentRegion) => void;
    viewportRef?: React.Ref<HTMLDivElement>;
    // Page to open on once pdf.js has laid out the pages; onReady fires after that, or right away without one.
    initialPage?: number;
    onReady?: () => void;
}

// Room for the floating page and zoom controls above whatever the viewer scrolls to.
const MIN_TOP_CLEARANCE = 88;
// Length of the highlight-flash animation (globals.css).
const HIGHLIGHT_FLASH_MS = 1400;

// Scrolls so a box of this height, now `currentTop` px below the viewer's top, sits in the middle (never under the controls).
const scrollToMiddle = (container: HTMLElement, currentTop: number, height: number) => {
    const target = Math.max(MIN_TOP_CLEARANCE, (container.clientHeight - height) / 2);
    container.scrollTop += currentTop - target;
};

// pdf.js draws a page's text layer only once the page is near the view.
const TEXT_LAYER_TIMEOUT_MS = 3000;
const waitForTextLayer = (viewer: PDFViewer, pageNumber: number): Promise<Element | null> =>
    new Promise((resolve) => {
        const find = (): Element | null => findPageElement(viewer.container, pageNumber)?.querySelector(".textLayer") ?? null;
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

export const PdfViewer: React.FC<PdfViewerProps> = ({
    publicUrl,
    highlights,
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
    onRegionTeach,
    onRegionEnlarge,
    viewportRef,
    initialPage,
    onReady,
}) => {
    // pdf.js's scrolling element, as state so the viewer and its listeners start once it's mounted.
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const pdfDocument = usePdfDocument(publicUrl);
    const viewer = usePdfViewer({ container, pdfDocument, scale, initialPage, onPageChange, onReady });
    const selection = usePdfSelection(container, onTextSelection);
    const textMatchRequestRef = useRef(0);

    useEffect(() => {
        if (!pdfDocument) return;
        setNumPages(pdfDocument.numPages);
        onPdfLoad?.(pdfDocument);
    }, [pdfDocument, setNumPages, onPdfLoad]);

    usePdfPageOverlay({ viewer, examMode, selectedPages, onPageSelect });

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
            teachAria: {
                table: tRegions("teach", { kind: "table" }),
                image: tRegions("teach", { kind: "image" }),
                figure: tRegions("teach", { kind: "figure" }),
                formula: tRegions("teach", { kind: "formula" }),
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
        onTeach: (region) => onRegionTeach?.(region),
        onEnlarge: (region) => onRegionEnlarge?.(region),
    });

    useRegionCrop({
        container,
        enabled: regionMode,
        // In fractions of the page: the region is redrawn from the PDF, whatever the zoom.
        onCrop: (region) => onRegionSelection?.(region, container ? createRegionAnchor(container, region) : null),
    });

    useHighlightPointer({ container, enabled: !regionMode, onClick: onHighlightClick });

    const highlightsRef = useRef(highlights);
    useEffect(() => {
        highlightsRef.current = highlights;
    }, [highlights]);

    const [flashedId, setFlashedId] = useState<string | null>(null);
    useEffect(() => {
        if (!flashedId) return;
        const timeout = setTimeout(() => setFlashedId(null), HIGHLIGHT_FLASH_MS);
        return () => clearTimeout(timeout);
    }, [flashedId]);

    useImperativeHandle(navigationRef, () => ({
        goToPage: (pageNumber, destination) => {
            if (!viewer) return;
            viewer.scrollPageIntoView({ pageNumber, destArray: destination });
            // pdf.js puts the destination at the very top, under the floating controls.
            if (destination) viewer.container.scrollTop -= MIN_TOP_CLEARANCE;
        },
        createRegionAnchor: (region) => (viewer ? createRegionAnchor(viewer.container, region) : null),
        showRegion: (region) => {
            if (!viewer) return;
            viewer.scrollPageIntoView({ pageNumber: region.pageNumber });
            flashRegion(viewer, region);
        },
        returnToRegion: async (region) => {
            if (!viewer) return null;
            viewer.scrollPageIntoView({ pageNumber: region.pageNumber });
            flashRegion(viewer, region);
            await waitForTextLayer(viewer, region.pageNumber);
            return createRegionAnchor(viewer.container, region);
        },
        scrollToHighlight: (id) => {
            const highlight = highlightsRef.current.find((item) => item.id === id);
            const span = highlight && getHighlightSpan(highlight);
            const page = viewer && span && findPageElement(viewer.container, span.pageNumber);
            if (!viewer || !span || !page) return false;
            const pageTop = page.getBoundingClientRect().top + page.clientTop - viewer.container.getBoundingClientRect().top;
            scrollToMiddle(viewer.container, pageTop + span.top * page.clientHeight, span.height * page.clientHeight);
            setFlashedId(id);
            return true;
        },
        showTextMatch: async (pageNumber, query, occurrence) => {
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
    }), [viewer]);

    return (
        // contain:paint also clips position:fixed descendants (popovers portaled here), which overflow-hidden alone doesn't.
        <div ref={viewportRef} className="flex-1 overflow-hidden bg-reader-canvas relative [contain:paint]">
            {!pdfDocument && <PdfSkeleton />}
            {/* pdf.js needs its container absolutely positioned, with the pages' element as its first child. */}
            <div ref={setContainer} className="pdf-viewer-scroll absolute inset-0 overflow-auto">
                <div className="pdfViewer" />
                {container && selection && (
                    <SelectionTip container={container} selection={selection}>
                        {selectionTip}
                    </SelectionTip>
                )}
            </div>
            {viewer && <HighlightLayer viewer={viewer} highlights={highlights} flashedId={flashedId} />}
        </div>
    );
};
