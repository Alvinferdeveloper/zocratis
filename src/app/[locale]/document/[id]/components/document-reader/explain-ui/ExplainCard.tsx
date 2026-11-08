"use client";

import { useTranslations } from "next-intl";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { LiveAnchorTarget, useLiveAnchor } from "@/app/[locale]/document/[id]/hooks/useLiveAnchor";
import { isScrollbarPointerDown } from "@/app/[locale]/document/[id]/lib/scrollbar";
import type { ExplainSubject } from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { ExplainPanel, type ExplainPanelProps } from "./ExplainPanel";

// A selected passage or a region of a page, with what the card anchors to.
export interface ExplainSelection extends ExplainSubject {
  anchor: LiveAnchorTarget;
}

interface ExplainCardProps extends Omit<ExplainPanelProps, "subject"> {
  selection: ExplainSelection | null;
  // Rendering inside the reader keeps the card clipped under the Header instead of floating over it.
  portalContainer?: HTMLElement | null;
}

// The explanation of a selected passage or region, anchored to it like the vocabulary card.
export const ExplainCard: React.FC<ExplainCardProps> = ({ selection, portalContainer, onClose, ...panelProps }) => {
  const t = useTranslations("reader.explain");
  const { virtualRef, boundary } = useLiveAnchor(selection?.anchor ?? null, onClose);

  return (
    <Popover open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      {virtualRef && <PopoverAnchor virtualRef={virtualRef} />}

      <PopoverContent
        container={portalContainer}
        side="bottom"
        align="start"
        sideOffset={10}
        collisionPadding={16}
        collisionBoundary={boundary ?? []}
        onPointerDownOutside={(e) => {
          if (isScrollbarPointerDown(e.detail.originalEvent)) e.preventDefault();
        }}
        // Grabbing the PDF scrollbar can move focus into the viewer; only real clicks outside should close it.
        onFocusOutside={(e) => {
          if (boundary?.contains(e.detail.originalEvent.target as Node)) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-label={t("ariaLabel")}
        className="w-[min(26rem,calc(100vw-2rem))] origin-(--radix-popover-content-transform-origin) p-0"
      >
        {selection && (
          // A new selection starts a fresh trail and levels.
          <ExplainPanel key={selection.id} subject={selection} onClose={onClose} {...panelProps} />
        )}
      </PopoverContent>
    </Popover>
  );
};
