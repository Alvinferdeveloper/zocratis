"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import { cn } from "@/lib/utils";
import {
    groupPartsByPage,
    HIGHLIGHT_PART_CLASS,
    type HighlightPart,
    type PdfHighlightItem,
} from "@/app/[locale]/document/[id]/lib/page-highlights";

const LAYER_CLASS = "highlight-layer";
const NO_PARTS: HighlightPart[] = [];

type PageLayers = Map<number, HTMLElement>;

// A layer in every drawn page, placed right after its canvas.
const collectLayers = (container: HTMLElement): PageLayers => {
    const layers: PageLayers = new Map();
    container.querySelectorAll<HTMLElement>(".page").forEach((page) => {
        const canvasWrapper = page.querySelector(":scope > .canvasWrapper");
        if (!canvasWrapper) return;
        let layer = page.querySelector<HTMLElement>(`:scope > .${LAYER_CLASS}`);
        if (!layer) {
            layer = document.createElement("div");
            layer.className = LAYER_CLASS;
            canvasWrapper.after(layer);
        }
        layers.set(Number(page.dataset.pageNumber), layer);
    });
    return layers;
};

const isSameLayers = (a: PageLayers, b: PageLayers): boolean =>
    a.size === b.size && Array.from(a).every(([pageNumber, layer]) => b.get(pageNumber) === layer);

const toPercent = (fraction: number) => `${fraction * 100}%`;

const getPartStyle = (part: HighlightPart): React.CSSProperties => ({
    left: toPercent(part.left),
    top: toPercent(part.top),
    width: toPercent(part.width),
    height: toPercent(part.height),
    ...(part.variant === "explanation"
        ? { background: "color-mix(in oklch, var(--primary) 26%, transparent)", borderBottom: "2px solid var(--primary)" }
        : { background: part.color }),
});

const PageHighlights = memo(({ parts, flashedId }: { parts: HighlightPart[]; flashedId: string | null }) =>
    parts.map((part, index) => (
        <div
            key={index}
            data-highlight-id={part.id}
            className={cn(HIGHLIGHT_PART_CLASS, part.id === flashedId && "highlight-part--flash")}
            style={getPartStyle(part)}
        />
    ))
);
PageHighlights.displayName = "PageHighlights";

interface HighlightLayerProps {
    viewer: PDFViewer;
    highlights: PdfHighlightItem[];
    // The highlight the reader just jumped to, outlined briefly.
    flashedId: string | null;
}

// Draws the highlights of every page pdf.js has on screen.
export const HighlightLayer = ({ viewer, highlights, flashedId }: HighlightLayerProps) => {
    const [layers, setLayers] = useState<PageLayers>(() => new Map());
    const partsByPage = useMemo(() => groupPartsByPage(highlights), [highlights]);

    // pdf.js empties a page when it redraws it (zoom, scrolling far away), which takes the layer with it.
    useEffect(() => {
        const sync = () => {
            const next = collectLayers(viewer.container);
            setLayers((current) => (isSameLayers(current, next) ? current : next));
        };
        sync();
        viewer.eventBus.on("pagerendered", sync);
        viewer.eventBus.on("scalechanging", sync);
        return () => {
            viewer.eventBus.off("pagerendered", sync);
            viewer.eventBus.off("scalechanging", sync);
            viewer.container.querySelectorAll(`.${LAYER_CLASS}`).forEach((layer) => layer.remove());
        };
    }, [viewer]);

    return Array.from(layers, ([pageNumber, layer]) =>
        createPortal(<PageHighlights parts={partsByPage.get(pageNumber) ?? NO_PARTS} flashedId={flashedId} />, layer, pageNumber)
    );
};
