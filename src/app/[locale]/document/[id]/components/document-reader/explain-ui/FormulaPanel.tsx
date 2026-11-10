"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorText } from "@/components/api-error-message";
import { getApiErrorKey } from "@/lib/api-errors";
import { trackEvent } from "@/lib/product-events";
import { cn } from "@/lib/utils";
import type { ExplainSubject } from "@/app/[locale]/document/[id]/hooks/useExplanation";
import { type FormulaSymbol, useFormulaLayers } from "@/app/[locale]/document/[id]/hooks/useFormulaLayers";
import { formulaToMarkdown } from "@/app/[locale]/document/[id]/lib/formula";
import { toExcerpt } from "@/app/[locale]/document/[id]/lib/explanation";
import { ComprehensionCheck } from "./ComprehensionCheck";
import { ExplainActions, type ExplainHandlers } from "./ExplainActions";
import { ExplainCardForm } from "./ExplainCardForm";
import { MathFormula } from "./MathFormula";

const LAYER_LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

interface SymbolRowProps {
  symbol: FormulaSymbol;
  isOpen: boolean;
  onToggle: () => void;
  onDefinitionJump: (page: number) => void;
}

const SymbolRow: React.FC<SymbolRowProps> = ({ symbol, isOpen, onToggle, onDefinitionJump }) => {
  const t = useTranslations("reader.formula");
  const { definition } = symbol;

  return (
    <li className="flex flex-col gap-1.5 py-1.5">
      <div className="flex items-baseline gap-3">
        <MathFormula latex={symbol.latex} className="w-12 shrink-0 overflow-hidden" />
        <span className="min-w-0 flex-1 text-sm">{symbol.meaning}</span>
        {definition ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={t("showDefinition", { symbol: symbol.text, page: definition.page })}
            className="flex shrink-0 items-center gap-0.5 rounded text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {t("page", { page: definition.page })}
            <ChevronRight aria-hidden className={cn("size-3 transition-transform duration-150", isOpen && "rotate-90")} />
          </button>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">{t("notDefined")}</span>
        )}
      </div>
      {definition && isOpen && (
        <div className="flex flex-col items-start gap-1 rounded-lg bg-muted p-2.5">
          <p className="text-[13px] leading-relaxed">{definition.excerpt}</p>
          <Button variant="link" size="sm" onClick={() => onDefinitionJump(definition.page)} className="h-auto px-0">
            {t("goToPage", { page: definition.page })}
          </Button>
        </div>
      )}
    </li>
  );
};

interface FormulaPanelProps extends ExplainHandlers {
  documentId: string;
  subject: ExplainSubject;
  onClose: () => void;
  onDefinitionJump: (page: number) => void;
}

// A formula read in layers, in order: what its symbols mean, what it says, and a worked example.
export const FormulaPanel: React.FC<FormulaPanelProps> = ({
  documentId,
  subject,
  onClose,
  onDefinitionJump,
  onSaveNote,
  onAskMore,
  onOpenConversation,
  noteAction,
}) => {
  const t = useTranslations("reader.formula");
  const tExplain = useTranslations("reader.explain");
  const tActions = useTranslations("common.actions");
  const { layers, isLoading, error, retry, thinkAgain } = useFormulaLayers(documentId, subject);
  const [revealed, setRevealed] = useState(0);
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  const label = subject.region
    ? tExplain("regionLabel", { kind: subject.regionKind ?? "crop", page: subject.pageNumber })
    : `«${toExcerpt(subject.text)}»`;

  const reveal = (layer: "intuition" | "example") => {
    trackEvent("formula_layer_opened", { layer });
    setRevealed(layer === "intuition" ? 1 : 2);
  };

  const toggleSymbol = (symbol: FormulaSymbol) => {
    if (openSymbol !== symbol.latex) trackEvent("formula_layer_opened", { layer: "definition" });
    setOpenSymbol((current) => (current === symbol.latex ? null : symbol.latex));
  };

  // With no symbols to read first (something that isn't a formula), the intuition is all there is.
  const showsIntuition = layers !== null && (revealed >= 1 || layers.symbols.length === 0);

  return (
    <section className="flex max-h-[min(34rem,var(--radix-popover-content-available-height))] flex-col">
      <header className="flex min-h-11 shrink-0 items-center gap-1 pl-3 pr-2 pt-1">
        <p className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground">{label}</p>
        <IconButton size="icon-sm" label={tActions("close")} onClick={onClose} className="shrink-0">
          <X className="size-3.5" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" aria-live="polite" aria-busy={isLoading}>
        <div className="flex flex-col gap-3 px-5 pb-4 pt-1">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-1">
              <Skeleton className="h-8 w-3/4 self-center" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-2 py-1">
              <p role="alert" className="text-sm text-destructive">
                <ApiErrorText errorKey={getApiErrorKey(error)} />
              </p>
              <Button variant="outline" size="sm" onClick={retry}>
                {tExplain("retry")}
              </Button>
            </div>
          ) : (
            layers && (
              <>
                {layers.latex && (
                  <div className="overflow-x-auto scrollbar-thin">
                    <MathFormula latex={layers.latex} display />
                  </div>
                )}

                {layers.symbols.length > 0 && (
                  <section>
                    <h3 className={LAYER_LABEL}>{t("symbols")}</h3>
                    <ul className="mt-1 divide-y divide-border">
                      {layers.symbols.map((symbol) => (
                        <SymbolRow
                          key={symbol.latex}
                          symbol={symbol}
                          isOpen={openSymbol === symbol.latex}
                          onToggle={() => toggleSymbol(symbol)}
                          onDefinitionJump={onDefinitionJump}
                        />
                      ))}
                    </ul>
                  </section>
                )}

                {showsIntuition ? (
                  <section>
                    <h3 className={LAYER_LABEL}>{t("intuition")}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">{layers.intuition}</p>
                  </section>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => reveal("intuition")} className="self-start">
                    {t("revealIntuition")}
                  </Button>
                )}

                {showsIntuition && layers.example && revealed < 2 && (
                  <Button variant="outline" size="sm" onClick={() => reveal("example")} className="self-start">
                    {t("revealExample")}
                  </Button>
                )}

                {layers.example && revealed >= 2 && (
                  <section className="flex flex-col gap-2">
                    <h3 className={LAYER_LABEL}>{t("example")}</h3>
                    <p className="text-sm">{layers.example.setup}</p>
                    <ol className="flex flex-col gap-2">
                      {layers.example.steps.map((step) => (
                        <li key={step.expression}>
                          <p className="text-xs text-muted-foreground">{step.label}</p>
                          <div className="overflow-x-auto scrollbar-thin">
                            <MathFormula latex={step.latex} />
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="text-sm">{layers.example.conclusion}</p>
                  </section>
                )}

                {layers.check && showsIntuition && (
                  <ComprehensionCheck documentId={documentId} pageNumber={subject.pageNumber} check={layers.check} />
                )}

                {isCardOpen && (
                  <ExplainCardForm
                    documentId={documentId}
                    pageNumber={subject.pageNumber}
                    front={t("cardFront", { page: subject.pageNumber })}
                    back={layers.intuition}
                    onClose={() => setIsCardOpen(false)}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>

      <ExplainActions
        documentId={documentId}
        subject={subject}
        markdown={layers && formulaToMarkdown(layers)}
        viewKey="formula"
        title={label}
        isBusy={isLoading}
        isCardOpen={isCardOpen}
        onThinkAgain={thinkAgain}
        onOpenCard={() => setIsCardOpen(true)}
        onSaveNote={onSaveNote}
        onAskMore={onAskMore}
        onOpenConversation={onOpenConversation}
        noteAction={noteAction}
      />
    </section>
  );
};
