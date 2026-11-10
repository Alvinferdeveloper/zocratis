"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { LiveAnchorTarget, useLiveAnchor } from "@/app/[locale]/document/[id]/hooks/useLiveAnchor";
import { canReadAsFormula } from "@/app/[locale]/document/[id]/lib/formula";
import { isScrollbarPointerDown } from "@/app/[locale]/document/[id]/lib/scrollbar";
import type { ExplainSubject } from "@/app/[locale]/document/[id]/hooks/useExplanation";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import type { SelectionRect } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import { ExplainPanel, type ExplainPanelProps } from "./ExplainPanel";

// Loaded with the first formula, so math rendering stays out of the reader's bundle.
const FormulaPanel = dynamic(() => import("./FormulaPanel").then((module) => module.FormulaPanel), { ssr: false });

// A selected passage or a region of a page, with what the card anchors to.
export interface ExplainSelection extends ExplainSubject {
  anchor: LiveAnchorTarget;
  // A fresh text selection, to keep the passage on the page once it's explained.
  selectionRects?: SelectionRect[];
  // The area of the page a passage covers, to redraw it if it's read as a formula.
  textRegion?: PageRegion;
  // The student asked to read this as a formula; detected formulas open that way on their own.
  asFormula?: boolean;
}

interface ExplainCardProps extends Omit<ExplainPanelProps, "subject" | "onViewLayers"> {
  selection: ExplainSelection | null;
  // Rendering inside the reader keeps the card clipped under the Header instead of floating over it.
  portalContainer?: HTMLElement | null;
  onViewLayers: () => void;
  onDefinitionJump: (page: number) => void;
}

const opensAsFormula = (selection: ExplainSelection): boolean => selection.asFormula === true || selection.regionKind === "formula";

// The explanation of a selected passage or region, anchored to it like the vocabulary card.
export const ExplainCard: React.FC<ExplainCardProps> = ({
  selection,
  portalContainer,
  onClose,
  onViewLayers,
  onDefinitionJump,
  ...panelProps
}) => {
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
        {selection &&
          (opensAsFormula(selection) ? (
            <FormulaPanel
              key={selection.id}
              documentId={panelProps.documentId}
              subject={selection}
              onClose={onClose}
              onDefinitionJump={onDefinitionJump}
              onSaveNote={panelProps.onSaveNote}
              onAskMore={panelProps.onAskMore}
              onOpenConversation={panelProps.onOpenConversation}
              noteAction={panelProps.noteAction}
            />
          ) : (
            // A new selection starts a fresh trail and levels.
            <ExplainPanel
              key={selection.id}
              subject={selection}
              onClose={onClose}
              onViewLayers={canReadAsFormula(selection) ? onViewLayers : undefined}
              {...panelProps}
            />
          ))}
      </PopoverContent>
    </Popover>
  );
};
