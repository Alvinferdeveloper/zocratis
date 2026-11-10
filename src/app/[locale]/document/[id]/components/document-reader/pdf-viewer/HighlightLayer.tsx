"use client";

import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import { HIGHLIGHT_ID_ATTRIBUTE } from "@/app/[locale]/document/[id]/hooks/useHighlightPointer";
import type { FractionRect, PageHighlight } from "@/app/[locale]/document/[id]/lib/page-highlights";

const LAYER_CLASS = "highlight-layer";
const NO_HIGHLIGHTS: PageHighlight[] = [];

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

// All of a highlight's boxes as one path: where they overlap, its color is painted once instead of twice.
const toShape = (rects: FractionRect[]): string =>
    rects.map((rect) => `M${rect.left} ${rect.top}H${rect.right}V${rect.bottom}H${rect.left}Z`).join("");

const toUnderline = (rects: FractionRect[]): string => rects.map((rect) => `M${rect.left} ${rect.bottom}H${rect.right}`).join("");

const PageHighlights = memo(({ highlights, flashedId }: { highlights: PageHighlight[]; flashedId: string | null }) => (
    // In fractions of the page, stretched over it, so the shapes follow the zoom without redrawing.
    <svg className="highlight-shapes" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        {highlights.map((highlight) => (
            <g
                key={highlight.id}
                {...{ [HIGHLIGHT_ID_ATTRIBUTE]: highlight.id }}
                className={highlight.id === flashedId ? "highlight-shape--flash" : undefined}
            >
                {highlight.variant === "explanation" ? (
                    <>
                        <path d={toShape(highlight.rects)} style={{ fill: "color-mix(in oklch, var(--primary) 26%, transparent)" }} />
                        <path d={toUnderline(highlight.rects)} className="highlight-underline" />
                    </>
                ) : (
                    <path d={toShape(highlight.rects)} style={{ fill: highlight.color }} />
                )}
            </g>
        ))}
    </svg>
));
PageHighlights.displayName = "PageHighlights";

interface HighlightLayerProps {
    viewer: PDFViewer;
    highlightsByPage: Map<number, PageHighlight[]>;
    // The highlight the reader just jumped to, outlined briefly.
    flashedId: string | null;
}

// Draws the highlights of every page pdf.js has on screen.
export const HighlightLayer = ({ viewer, highlightsByPage, flashedId }: HighlightLayerProps) => {
    const [layers, setLayers] = useState<PageLayers>(() => new Map());

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
        createPortal(<PageHighlights highlights={highlightsByPage.get(pageNumber) ?? NO_HIGHLIGHTS} flashedId={flashedId} />, layer, pageNumber)
    );
};
