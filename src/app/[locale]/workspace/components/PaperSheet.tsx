import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const LINE_WIDTHS = ["w-full", "w-4/5", "w-full", "w-3/5", "w-11/12", "w-2/3"];

const sheetVariants = cva("relative aspect-[3/4] shrink-0 bg-ivory-sheet shadow-lift", {
  variants: {
    size: {
      sm: "w-4 rounded-[2px] px-[3px] pt-[4px]",
      md: "w-16 rounded-[3px] px-2.5 pb-5 pt-3",
    },
  },
  defaultVariants: { size: "md" },
});

const LINE_COUNT = { sm: 3, md: LINE_WIDTHS.length } as const;

interface PaperSheetProps extends VariantProps<typeof sheetVariants> {
  // Page number printed in the corner, for a sheet open where the reader left off.
  page?: number;
  // The ochre bookmark ribbon: this document is being read.
  bookmarked?: boolean;
  className?: string;
}

// A sheet of paper standing in for a document: the workspace shows pages, not file icons.
export const PaperSheet: React.FC<PaperSheetProps> = ({ size, page, bookmarked = false, className }) => {
  const resolvedSize = size ?? "md";

  return (
    <div aria-hidden className={cn(sheetVariants({ size }), className)}>
      <div className={cn("flex flex-col", resolvedSize === "sm" ? "gap-[2px]" : "gap-1.5")}>
        {LINE_WIDTHS.slice(0, LINE_COUNT[resolvedSize]).map((width, index) => (
          <span
            key={index}
            className={cn("rounded-full bg-muted-foreground/30 dark:bg-background/25", resolvedSize === "sm" ? "h-px" : "h-[2px]", width)}
          />
        ))}
      </div>
      {page !== undefined && (
        <span className="absolute bottom-1.5 right-2 font-serif text-[10px] italic tabular-nums text-muted-foreground dark:text-background/70">
          {page}
        </span>
      )}
      {bookmarked && (
        <span
          className={cn(
            "absolute bg-ochre [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]",
            resolvedSize === "sm" ? "-top-px right-[3px] h-2 w-[3px]" : "-top-1 right-3 h-6 w-2.5"
          )}
        />
      )}
    </div>
  );
};
