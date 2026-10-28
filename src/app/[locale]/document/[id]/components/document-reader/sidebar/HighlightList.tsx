import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  groupByPage,
  searchHighlights,
  type SidebarHighlight,
} from "@/app/[locale]/document/[id]/lib/sidebar-highlights";

interface HighlightListProps {
  kind: "notes" | "vocabulary";
  items: SidebarHighlight[];
  currentPage: number;
  onSelect: (item: SidebarHighlight) => void;
}

// Saved highlights grouped by page in document order; the page being read is marked like the current thumbnail.
export const HighlightList: React.FC<HighlightListProps> = ({ kind, items, currentPage, onSelect }) => {
  const t = useTranslations(`reader.sidebar.${kind}`);
  const tSidebar = useTranslations("reader.sidebar");
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupByPage(searchHighlights(items, query)), [items, query]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm font-medium">{t("emptyTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pb-1">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="h-8 text-sm md:text-sm"
        />
      </div>

      {groups.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">{tSidebar("noResults")}</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {groups.map(([pageNumber, pageItems]) => (
            <li key={pageNumber}>
              <p
                className={cn(
                  "sticky top-0 z-10 bg-sidebar px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.08em]",
                  pageNumber === currentPage ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tSidebar("page", { page: pageNumber })}
              </p>
              <ul>
                {pageItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="press-feedback flex w-full gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 size-2 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm leading-snug">
                          {item.fromChat && (
                            <MessageSquare
                              aria-label={tSidebar("fromChat")}
                              className="mr-1 inline size-3.5 -translate-y-px text-muted-foreground"
                            />
                          )}
                          {item.title}
                        </span>
                        {item.detail && (
                          <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {item.detail}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
