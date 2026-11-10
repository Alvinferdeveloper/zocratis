import { useEffect, useCallback, useRef } from "react";
import type { PdfViewerHandle } from "@/app/[locale]/document/[id]/hooks/useRegionOverlays";

interface UsePdfPageOverlayProps {
    viewer: PdfViewerHandle | null;
    examMode: boolean;
    selectedPages: number[];
    onPageSelect: ((page: number) => void) | undefined;
}

const forEachPage = (viewer: PdfViewerHandle, visit: (pageEl: HTMLElement, pageNumber: number) => void) => {
    viewer.container.querySelectorAll<HTMLElement>(".page").forEach((pageEl) => {
        const pageNumber = parseInt(pageEl.dataset.pageNumber || "0");
        if (pageNumber) visit(pageEl, pageNumber);
    });
};

// In exam mode, covers every page with a click target that selects it for the exam.
export const usePdfPageOverlay = ({
    viewer,
    examMode,
    selectedPages,
    onPageSelect,
}: UsePdfPageOverlayProps) => {
    const onPageSelectRef = useRef(onPageSelect);
    const selectedPagesRef = useRef(selectedPages);

    useEffect(() => {
        onPageSelectRef.current = onPageSelect;
    }, [onPageSelect]);

    useEffect(() => {
        selectedPagesRef.current = selectedPages;
    }, [selectedPages]);

    // Looks live in globals.css (.exam-page-overlay); only the selected state is set here.
    const updatePageOverlay = useCallback((pageEl: HTMLElement, pageNumber: number) => {
        const overlay = pageEl.querySelector<HTMLDivElement>(".exam-page-overlay");
        const badge = pageEl.querySelector<HTMLDivElement>(".exam-page-badge");
        if (!overlay || !badge) return;

        const isSelected = selectedPagesRef.current.includes(pageNumber);
        overlay.dataset.selected = String(isSelected);
        badge.textContent = isSelected ? "✓" : "+";
    }, []);

    const createPageOverlay = useCallback((pageEl: HTMLElement, pageNumber: number) => {
        if (pageEl.querySelector(".exam-page-overlay")) return;

        const overlay = document.createElement("div");
        overlay.className = "exam-page-overlay";
        overlay.onclick = (e) => {
            e.stopPropagation();
            onPageSelectRef.current?.(pageNumber);
        };

        const badge = document.createElement("div");
        badge.className = "exam-page-badge";
        badge.setAttribute("aria-hidden", "true");

        overlay.appendChild(badge);
        pageEl.appendChild(overlay);
    }, []);

    // pdf.js empties a page when it redraws it, so the overlays are put back on every page render.
    useEffect(() => {
        if (!viewer || !examMode) return;
        const applyOverlays = () =>
            forEachPage(viewer, (pageEl, pageNumber) => {
                createPageOverlay(pageEl, pageNumber);
                updatePageOverlay(pageEl, pageNumber);
            });

        applyOverlays();
        viewer.eventBus.on("pagerendered", applyOverlays);
        return () => {
            viewer.eventBus.off("pagerendered", applyOverlays);
            viewer.container.querySelectorAll(".exam-page-overlay").forEach((overlay) => overlay.remove());
        };
    }, [viewer, examMode, createPageOverlay, updatePageOverlay]);

    useEffect(() => {
        if (viewer && examMode) forEachPage(viewer, updatePageOverlay);
    }, [viewer, selectedPages, examMode, updatePageOverlay]);
};
