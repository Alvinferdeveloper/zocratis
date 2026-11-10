import { useTranslations } from "next-intl";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface FormulaReturnNoticeProps {
  onReturn: () => void;
  onDismiss: () => void;
}

// After jumping to where a symbol is defined, the way back to the formula that sent the reader there.
export const FormulaReturnNotice: React.FC<FormulaReturnNoticeProps> = ({ onReturn, onDismiss }) => {
  const t = useTranslations("reader.formula");
  const tActions = useTranslations("common.actions");

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card p-1 text-sm shadow-float animate-in fade-in slide-in-from-bottom-2 duration-200 ease-[var(--ease-out)]"
      >
        <Button variant="ghost" size="sm" onClick={onReturn} className="text-foreground">
          <ArrowLeft />
          {t("returnToFormula")}
        </Button>
        <IconButton size="icon-sm" label={tActions("close")} onClick={onDismiss}>
          <X className="size-3.5" />
        </IconButton>
      </div>
    </div>
  );
};
