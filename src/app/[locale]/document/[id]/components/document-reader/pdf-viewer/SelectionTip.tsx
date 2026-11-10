"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { TextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import { SELECTION_TIP_ATTRIBUTE } from "@/app/[locale]/document/[id]/hooks/usePdfSelection";
import { findPageElement } from "@/app/[locale]/document/[id]/lib/page-regions";

// Space between the selection and its popup.
const GAP_PX = 5;

interface SelectionTipProps {
    // The viewer's scrolling element; the tip is rendered inside it, so it scrolls with the page.
    container: HTMLElement;
    selection: TextSelection;
    children: React.ReactNode;
}

interface Position {
    left: number;
    top: number;
}

// The selection's box in fractions of its page, so the tip follows it when the zoom changes.
const getSelectionBox = ({ rects }: TextSelection) => {
    const pageWidth = rects[0].pageWidth || 1;
    const pageHeight = rects[0].pageHeight || 1;
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.left + rect.width));
    return {
        centerX: (left + right) / 2 / pageWidth,
        top: Math.min(...rects.map((rect) => rect.top)) / pageHeight,
        bottom: Math.max(...rects.map((rect) => rect.top + rect.height)) / pageHeight,
    };
};

// Floats its content centred above a selection, or below it when there's no room above.
export const SelectionTip = ({ container, selection, children }: SelectionTipProps) => {
    const tipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<Position | null>(null);

    useLayoutEffect(() => {
        const tip = tipRef.current;
        const page = findPageElement(container, selection.pageNumber);
        if (!tip || !page) return;
        const box = getSelectionBox(selection);

        const place = () => {
            const pageTop = page.offsetTop + page.clientTop;
            const top = pageTop + box.top * page.clientHeight - tip.offsetHeight - GAP_PX;
            const centerX = page.offsetLeft + page.clientLeft + box.centerX * page.clientWidth;
            const next = {
                top: top < container.scrollTop ? pageTop + box.bottom * page.clientHeight + GAP_PX : top,
                left: Math.max(0, Math.min(centerX - tip.offsetWidth / 2, container.scrollWidth - tip.offsetWidth)),
            };
            setPosition((current) => (current?.top === next.top && current.left === next.left ? current : next));
        };

        place();
        // The content grows (a translation arrives) and the page resizes with the zoom.
        const observer = new ResizeObserver(place);
        observer.observe(tip);
        observer.observe(page);
        return () => observer.disconnect();
    }, [container, selection]);

    return (
        <div
            ref={tipRef}
            {...{ [SELECTION_TIP_ATTRIBUTE]: "" }}
            className="absolute z-40 w-max"
            style={{ ...position, visibility: position ? undefined : "hidden" }}
        >
            {children}
        </div>
    );
};
