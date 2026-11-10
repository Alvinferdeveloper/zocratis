import { useEffect, useRef } from "react";
import { findHighlightPartAt } from "@/app/[locale]/document/[id]/lib/page-highlights";

interface UseHighlightPointerOptions {
  container: HTMLElement | null;
  // Off while dragging crops regions, so a short drag doesn't open the note under it.
  enabled: boolean;
  onClick: (id: string, anchor: Element) => void;
}

const findPartUnder = (event: MouseEvent): HTMLElement | null => {
  const page = (event.target as Element).closest(".page");
  return page ? findHighlightPartAt(page, event.clientX, event.clientY) : null;
};

// Highlights sit under the text and never take the pointer: a click on one (not a drag, which selects text)
// is found by position, and the container is flagged while the pointer is over one (globals.css sets the cursor).
export const useHighlightPointer = ({ container, enabled, onClick }: UseHighlightPointerOptions) => {
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!container || !enabled) return;
    let frame = 0;

    const handleClick = (event: MouseEvent) => {
      if (event.altKey || !document.getSelection()?.isCollapsed) return;
      const part = findPartUnder(event);
      if (part?.dataset.highlightId) onClickRef.current(part.dataset.highlightId, part);
    };
    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        container.dataset.overHighlight = String(Boolean(findPartUnder(event)));
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
