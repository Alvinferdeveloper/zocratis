import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { REVEAL_ON_HOVER } from "@/app/[locale]/workspace/lib/item-styles";

interface ItemCheckboxProps {
  name: string;
  isSelected: boolean;
  // While anything is selected every checkbox stays visible, so adding to the selection needs no hover.
  selectionMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const ItemCheckbox: React.FC<ItemCheckboxProps> = ({ name, isSelected, selectionMode, onToggle, className }) => {
  const t = useTranslations("workspace.items");

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={onToggle}
      aria-label={t("select", { name })}
      className={cn("relative z-10", !selectionMode && REVEAL_ON_HOVER, className)}
    />
  );
};
