import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ROW_GRID } from "@/app/[locale]/workspace/lib/item-styles";
import type { ViewMode } from "@/app/[locale]/workspace/lib/view-mode";

interface ItemsSkeletonProps {
  viewMode: ViewMode;
  count?: number;
}

// Placeholders shaped like the rows or tiles they stand in for, so nothing jumps when the data arrives.
export const ItemsSkeleton: React.FC<ItemsSkeletonProps> = ({ viewMode, count = 6 }) => {
  const placeholders = Array.from({ length: count }, (_, index) => index);

  if (viewMode === "grid") {
    return (
      <>
        {placeholders.map((index) => (
          <div key={index} aria-hidden className="flex flex-col gap-2.5 p-2">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-1.5 px-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {placeholders.map((index) => (
        <div key={index} aria-hidden className={cn(ROW_GRID, "px-2 py-2.5")}>
          <span />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-4 rounded-[2px]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="hidden h-3 w-20 md:block" />
          <Skeleton className="hidden h-3 w-16 md:block" />
        </div>
      ))}
    </>
  );
};
