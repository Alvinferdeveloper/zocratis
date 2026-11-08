import { useTranslations } from "next-intl";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

// Takes the header's place while items are selected, with what can be done to all of them.
export const SelectionBar: React.FC<SelectionBarProps> = ({ count, onClear, onDownload, onDelete }) => {
  const t = useTranslations("workspace");

  return (
    <div className="flex w-full items-center gap-2 animate-in fade-in duration-150">
      <IconButton label={t("header.clearSelection")} onClick={onClear}>
        <X />
      </IconButton>
      <span className="text-sm font-medium tabular-nums" aria-live="polite">
        {t("header.selectedCount", { count })}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={onDownload}>
          <Download className="size-3.5" />
          {t("actions.download")}
        </Button>
        <Button variant="ghost-destructive" size="sm" onClick={onDelete}>
          <Trash2 className="size-3.5" />
          {t("actions.delete")}
        </Button>
      </div>
    </div>
  );
};
