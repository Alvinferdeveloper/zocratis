import { cn } from "@/lib/utils";
import { ROW_GRID } from "@/app/[locale]/workspace/lib/item-styles";
import { ItemLink } from "@/app/[locale]/workspace/components/items/ItemLink";
import { ItemCheckbox } from "@/app/[locale]/workspace/components/items/ItemCheckbox";

interface ItemRowProps {
  href: string;
  name: string;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
  // The two data columns, hidden on narrow screens.
  status?: React.ReactNode;
  date?: React.ReactNode;
  actions: React.ReactNode;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  href,
  name,
  icon,
  subtitle,
  status,
  date,
  actions,
  isSelected,
  selectionMode,
  onToggleSelect,
}) => (
  <div
    className={cn(
      ROW_GRID,
      "group relative rounded-lg px-2 py-2 transition-colors duration-150 ease-[var(--ease-out)]",
      isSelected ? "bg-primary/10" : "hover:bg-accent/60"
    )}
  >
    <ItemCheckbox name={name} isSelected={isSelected} selectionMode={selectionMode} onToggle={onToggleSelect} />

    <div className="flex min-w-0 items-center gap-3">
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      <div className="flex min-w-0 flex-col">
        <ItemLink href={href} className="text-sm font-medium text-foreground">
          {name}
        </ItemLink>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>

    <div className="hidden md:block">{status}</div>
    <div className="hidden truncate text-xs text-muted-foreground md:block">{date}</div>

    {actions}
  </div>
);
