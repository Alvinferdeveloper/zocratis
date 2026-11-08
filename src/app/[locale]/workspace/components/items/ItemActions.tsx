import { useTranslations } from "next-intl";
import { Download, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { REVEAL_ON_HOVER } from "@/app/[locale]/workspace/lib/item-styles";
import { DeleteConfirmationDialog, type DeletableItemType } from "@/app/[locale]/workspace/components/DeleteConfirmationDialog";

interface ItemActionsProps {
  itemType: DeletableItemType;
  isStarred: boolean;
  onToggleStar: () => void;
  onDelete: () => void;
  downloadHref?: string;
  // Tiles float their actions over the preview, so each one sits on its own chip.
  variant?: "row" | "tile";
  className?: string;
}

export const ItemActions: React.FC<ItemActionsProps> = ({
  itemType,
  isStarred,
  onToggleStar,
  onDelete,
  downloadHref,
  variant = "row",
  className,
}) => {
  const t = useTranslations("workspace.actions");
  const chip = variant === "tile" && "bg-card text-foreground shadow-lift";

  return (
    <div className={cn("relative z-10 flex items-center gap-1", className)}>
      <IconButton
        size="icon-sm"
        label={isStarred ? t("unstar") : t("star")}
        onClick={onToggleStar}
        className={cn(chip, isStarred ? "text-ochre hover:text-ochre" : REVEAL_ON_HOVER)}
      >
        <Star className={cn("size-3.5", isStarred && "fill-current")} />
      </IconButton>
      {downloadHref && (
        <Button asChild variant="ghost" size="icon-sm" className={cn(chip, REVEAL_ON_HOVER)}>
          <a href={downloadHref} target="_blank" rel="noopener noreferrer" aria-label={t("download")} title={t("download")}>
            <Download className="size-3.5" />
          </a>
        </Button>
      )}
      <DeleteConfirmationDialog
        itemType={itemType}
        onConfirm={onDelete}
        trigger={(open) => (
          <IconButton size="icon-sm" variant="ghost-destructive" label={t("delete")} onClick={open} className={cn(chip, REVEAL_ON_HOVER)}>
            <Trash2 className="size-3.5" />
          </IconButton>
        )}
      />
    </div>
  );
};
