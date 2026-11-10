import { toAnnotationGeometry } from "@/app/[locale]/document/[id]/lib/annotation-geometry";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import type { SelectionRect } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import type { FormulaLayers } from "@/app/[locale]/document/[id]/hooks/useFormulaLayers";

// Keeps subscripts and accents the text box leaves out.
const PADDING = 0.006;

// Same idea as the parser's OPERATORS (zocratis-parser `regions.py`), for text the student selects.
const MATH_CHARACTERS = /[=∑∏∫∮√∂∇≤≥≠≈≡∝∞±∓→⇒⇔↦∈∉⊂⊆∪∩∀∃Ͱ-Ͽ]/u;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

// A highlight's box, in the page's pixels at the zoom it was made, as fractions of the page.
export const boundingRectToRegion = (
  box: { x1: number; y1: number; x2: number; y2: number; width: number; height: number },
  pageNumber: number
): PageRegion => {
  const left = clamp(box.x1 / box.width - PADDING);
  const top = clamp(box.y1 / box.height - PADDING);
  return {
    pageNumber,
    left,
    top,
    width: clamp(box.x2 / box.width + PADDING) - left,
    height: clamp(box.y2 / box.height + PADDING) - top,
  };
};

export const selectionToRegion = (rects: SelectionRect[], pageNumber: number): PageRegion | undefined =>
  rects.length > 0 ? boundingRectToRegion(toAnnotationGeometry(rects, pageNumber).boundingRect, pageNumber) : undefined;

// A crop can be anything, so it's the student's call; plain prose never offers it.
export const canReadAsFormula = (subject: { text: string; image?: string; textRegion?: PageRegion }): boolean =>
  Boolean(subject.image) || (Boolean(subject.textRegion) && MATH_CHARACTERS.test(subject.text));

// Plain text only: notes and the chat don't render LaTeX.
export const formulaToMarkdown = (layers: FormulaLayers): string =>
  [
    layers.symbols.map((symbol) => `- **${symbol.text}**: ${symbol.meaning}`).join("\n"),
    layers.intuition,
    layers.example &&
      [
        layers.example.setup,
        ...layers.example.steps.map((step) => `- ${step.label}: ${step.expression} = ${step.result}`),
        layers.example.conclusion,
      ].join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
