import { useId } from "react";
import { useTranslations } from "next-intl";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLLECTION_COLORS, isPresetCollectionColor } from "@/app/[locale]/workspace/lib/collection-colors";

interface CollectionColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const swatchClass =
  "press-feedback flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const CollectionColorPicker: React.FC<CollectionColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const t = useTranslations("workspace.colorPicker");
  const labelId = useId();
  const isCustom = !isPresetCollectionColor(selectedColor);

  return (
    <div className="space-y-3">
      <p id={labelId} className="text-sm font-medium">
        {t("label")}
      </p>

      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-3">
        {COLLECTION_COLORS.map(({ id, value }) => {
          const isSelected = selectedColor.toLowerCase() === value;
          const name = t(`colors.${id}`);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={name}
              title={name}
              onClick={() => onColorChange(value)}
              style={{ backgroundColor: value }}
              className={cn(swatchClass, isSelected && "ring-2 ring-primary")}
            >
              {isSelected && <Check className="size-4 text-selection-foreground" strokeWidth={3} />}
            </button>
          );
        })}

        <label
          title={t("custom")}
          className={cn(
            swatchClass,
            "relative border border-input bg-card hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            isCustom && "border-transparent ring-2 ring-primary"
          )}
          style={isCustom ? { backgroundColor: selectedColor } : undefined}
        >
          <Palette className={cn("size-4", isCustom ? "text-selection-foreground" : "text-muted-foreground")} />
          <input
            type="color"
            aria-label={t("custom")}
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
};
