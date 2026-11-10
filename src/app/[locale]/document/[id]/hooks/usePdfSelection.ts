import { useEffect, useRef, useState } from "react";
import type { TextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import { readSelection } from "@/app/[locale]/document/[id]/lib/selection-geometry";

// Marks the popup shown over a selection, so pressing inside it doesn't count as leaving the selection.
export const SELECTION_TIP_ATTRIBUTE = "data-selection-tip";

// Keyboard and touch-handle selections have no "finished" event: they settle after this pause.
const SETTLE_DELAY_MS = 250;

const isSameSelection = (a: TextSelection | null, b: TextSelection): boolean =>
  !!a &&
  a.text === b.text &&
  a.pageNumber === b.pageNumber &&
  a.rects.length === b.rects.length &&
  a.rects[0].left === b.rects[0].left &&
  a.rects[0].top === b.rects[0].top;

// Follows the browser's selection inside the viewer (mouse, keyboard and touch) and reports it once it
// settles. Returns the settled selection while its popup should show: until the next press or Escape.
export const usePdfSelection = (container: HTMLElement | null, onSelection: (selection: TextSelection) => void): TextSelection | null => {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const onSelectionRef = useRef(onSelection);
  useEffect(() => {
    onSelectionRef.current = onSelection;
  }, [onSelection]);

  useEffect(() => {
    if (!container) return;
    let isPointerDown = false;
    let settled: TextSelection | null = null;
    let timer = 0;

    const dismiss = () => {
      settled = null;
      setSelection(null);
    };

    const settle = () => {
      const current = document.getSelection();
      const next = current && readSelection(current, container);
      if (!next || isSameSelection(settled, next)) return;
      settled = next;
      setSelection(next);
      onSelectionRef.current(next);
    };

    const handleSelectionChange = () => {
      window.clearTimeout(timer);
      // While the pointer is down the drag isn't over; its release settles it.
      if (!isPointerDown) timer = window.setTimeout(settle, SETTLE_DELAY_MS);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element).closest(`[${SELECTION_TIP_ATTRIBUTE}]`)) return;
      isPointerDown = true;
      dismiss();
    };

    const handlePointerUp = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      window.clearTimeout(timer);
      // After the click that follows: clicking on a selection only collapses it then.
      timer = window.setTimeout(settle, 0);
    };

    // A touch long-press hands the gesture to the browser: no release comes, only selection changes.
    const handlePointerCancel = () => {
      isPointerDown = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !settled) return;
      document.getSelection()?.removeAllRanges();
      dismiss();
    };

    container.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [container]);

  return selection;
};
