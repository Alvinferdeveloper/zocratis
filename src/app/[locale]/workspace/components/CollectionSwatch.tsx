import { cn } from "@/lib/utils";

// A collection drawn as a book spine in its cloth color; folders keep the folder icon, so the two never read as one.
export const CollectionSwatch: React.FC<{ color?: string; className?: string }> = ({ color, className }) => (
  <span
    aria-hidden
    className={cn("h-3.5 w-2.5 shrink-0 rounded-[2px] shadow-[inset_-2px_0_0_0_var(--scrim)]", className)}
    style={{ backgroundColor: color || "var(--muted-foreground)" }}
  />
);
