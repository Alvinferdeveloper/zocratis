import { useEffect, useRef } from "react";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// A press that barely moves is a click, not a crop.
const MIN_SIZE_PX = 8;

interface UseRegionCropOptions {
  container: HTMLElement | null;
  // Region mode: every drag crops. Outside it, only drags that start with Alt held do.
  enabled: boolean;
  onCrop: (region: PageRegion) => void;
}

// Dragging over a page draws a rectangle and reports it as a region of that page.
export const useRegionCrop = ({ container, enabled, onCrop }: UseRegionCropOptions) => {
  const latest = useRef({ enabled, onCrop });
  useEffect(() => {
    latest.current = { enabled, onCrop };
  });

  useEffect(() => {
    if (!container) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || !(latest.current.enabled || event.altKey)) return;
      const page = (event.target as Element).closest<HTMLElement>(".page");
      if (!page) return;
      // Keeps the drag from selecting text.
      event.preventDefault();
      document.getSelection()?.removeAllRanges();

      const toPagePoint = ({ clientX, clientY }: MouseEvent) => {
        const bounds = page.getBoundingClientRect();
        return {
          x: Math.min(Math.max(clientX - bounds.left - page.clientLeft, 0), page.clientWidth),
          y: Math.min(Math.max(clientY - bounds.top - page.clientTop, 0), page.clientHeight),
        };
      };
      const start = toPagePoint(event);
      const readBox = (moveEvent: MouseEvent) => {
        const point = toPagePoint(moveEvent);
        return {
          left: Math.min(start.x, point.x),
          top: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
        };
      };

      const outline = document.createElement("div");
      outline.className = "region-crop";
      outline.setAttribute("aria-hidden", "true");
      page.appendChild(outline);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const box = readBox(moveEvent);
        outline.style.left = `${box.left}px`;
        outline.style.top = `${box.top}px`;
        outline.style.width = `${box.width}px`;
        outline.style.height = `${box.height}px`;
      };
      const stop = () => {
        outline.remove();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleKeyDown);
      };
      const handleMouseUp = (upEvent: MouseEvent) => {
        const box = readBox(upEvent);
        stop();
        if (box.width < MIN_SIZE_PX || box.height < MIN_SIZE_PX) return;
        latest.current.onCrop({
          pageNumber: Number(page.dataset.pageNumber),
          left: box.left / page.clientWidth,
          top: box.top / page.clientHeight,
          width: box.width / page.clientWidth,
          height: box.height / page.clientHeight,
        });
      };
      const handleKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === "Escape") stop();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleKeyDown);
    };

    container.addEventListener("mousedown", handleMouseDown);
    return () => container.removeEventListener("mousedown", handleMouseDown);
  }, [container]);
};
