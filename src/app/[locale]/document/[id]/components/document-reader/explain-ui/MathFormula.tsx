"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathFormulaProps {
  latex: string;
  display?: boolean;
  className?: string;
}

const render = (latex: string, display: boolean): string | null => {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: true, strict: false });
  } catch {
    return null;
  }
};

// LaTeX written by the model: what KaTeX can't parse is shown as plain text instead of an error.
export const MathFormula: React.FC<MathFormulaProps> = ({ latex, display = false, className }) => {
  const html = useMemo(() => render(latex, display), [latex, display]);
  if (html === null) return <code className={className}>{latex}</code>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};
