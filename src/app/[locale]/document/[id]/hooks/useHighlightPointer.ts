import { useEffect, useRef } from "react";
import { findHighlightAt, type PageHighlight } from "@/app/[locale]/document/[id]/lib/page-highlights";

// Set on each highlight's element by HighlightLayer, so a clicked highlight can be anchored to.
export const HIGHLIGHT_ID_ATTRIBUTE = "data-highlight-id";

interface UseHighlightPointerOptions {
  container: HTMLElement | null;
  highlightsByPage: Map<number, PageHighlight[]>;
  // Off while dragging crops regions, so a short drag doesn't open the note under it.
  enabled: boolean;
  onClick: (id: string, anchor: Element) => void;
}

// Highlights sit under the text and never take the pointer: a click on one (not a drag, which selects text)
// is found by position, and the container is flagged while the pointer is over one (globals.css sets the cursor).
export const useHighlightPointer = ({ container, highlightsByPage, enabled, onClick }: UseHighlightPointerOptions) => {
  const latest = useRef({ highlightsByPage, onClick });
  useEffect(() => {
    latest.current = { highlightsByPage, onClick };
  });

  useEffect(() => {
    if (!container || !enabled) return;
    let frame = 0;

    const findUnder = (event: MouseEvent): { id: string; page: HTMLElement } | null => {
      const page = (event.target as Element).closest<HTMLElement>(".page");
      if (!page) return null;
      const bounds = page.getBoundingClientRect();
      const highlight = findHighlightAt(
        latest.current.highlightsByPage.get(Number(page.dataset.pageNumber)) ?? [],
        (event.clientX - bounds.left - page.clientLeft) / page.clientWidth,
        (event.clientY - bounds.top - page.clientTop) / page.clientHeight
      );
      return highlight ? { id: highlight.id, page } : null;
    };

    const handleClick = (event: MouseEvent) => {
      if (event.altKey || !document.getSelection()?.isCollapsed) return;
      const hit = findUnder(event);
      const anchor = hit?.page.querySelector(`[${HIGHLIGHT_ID_ATTRIBUTE}="${CSS.escape(hit.id)}"]`);
      if (hit && anchor) latest.current.onClick(hit.id, anchor);
    };
    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        container.dataset.overHighlight = String(Boolean(findUnder(event)));
      });
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("mousemove", handleMove);
    return () => {
      cancelAnimationFrame(frame);
      delete container.dataset.overHighlight;
      container.removeEventListener("click", handleClick);
      container.removeEventListener("mousemove", handleMove);
    };
  }, [container, enabled]);
};
