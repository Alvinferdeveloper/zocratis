import { cn } from "@/lib/utils";
import { ItemLink } from "@/app/[locale]/workspace/components/items/ItemLink";
import { ItemCheckbox } from "@/app/[locale]/workspace/components/items/ItemCheckbox";

interface ItemTileProps {
  href: string;
  name: string;
  // Collection color the preview tray is tinted with.
  tint: string;
  preview: React.ReactNode;
  // Drawn along the bottom of the tray, e.g. reading progress.
  footer?: React.ReactNode;
  meta: React.ReactNode;
  actions: React.ReactNode;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
}

export const ItemTile: React.FC<ItemTileProps> = ({
  href,
  name,
  tint,
  preview,
  footer,
  meta,
  actions,
  isSelected,
  selectionMode,
  onToggleSelect,
}) => (
  <div
    className={cn(
      "group relative flex flex-col gap-2.5 rounded-lg p-2 transition-colors duration-150 ease-[var(--ease-out)]",
      isSelected ? "bg-primary/10" : "hover:bg-accent/60"
    )}
  >
    <div
      className={cn("relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md", isSelected && "ring-2 ring-primary")}
      style={{ backgroundColor: `color-mix(in oklch, ${tint} 12%, var(--muted))` }}
    >
      <div className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-1 motion-reduce:transform-none">
        {preview}
      </div>
      {footer}
      <ItemCheckbox
        name={name}
        isSelected={isSelected}
        selectionMode={selectionMode}
        onToggle={onToggleSelect}
        className="absolute left-2.5 top-2.5"
      />
      <div className="absolute right-2 top-2">{actions}</div>
    </div>

    <div className="flex min-w-0 flex-col gap-0.5 px-1">
      <ItemLink href={href} className="text-sm font-medium text-foreground">
        {name}
      </ItemLink>
      <div className="truncate text-xs text-muted-foreground">{meta}</div>
    </div>
  </div>
);
