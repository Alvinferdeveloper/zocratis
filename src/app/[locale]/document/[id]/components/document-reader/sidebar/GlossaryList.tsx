import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type GlossaryEntry, useGlossary } from "@/app/[locale]/document/[id]/hooks/useGlossary";

// Accent- and case-insensitive, so "entropia" finds "entropía".
const normalize = (text: string): string => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const matches = (entry: GlossaryEntry, query: string): boolean =>
  normalize(`${entry.term} ${entry.translation ?? ""} ${entry.coreIdea}`).includes(query);

interface GlossaryListProps {
  documentId: string;
  onPageSelect: (pageNumber: number) => void;
}

// The document's technical vocabulary, built from the terms the student opened in explanations.
export const GlossaryList: React.FC<GlossaryListProps> = ({ documentId, onPageSelect }) => {
  const t = useTranslations("reader.sidebar.glossary");
  const tSidebar = useTranslations("reader.sidebar");
  const { data: entries = [], isLoading } = useGlossary(documentId);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = normalize(query.trim());
    return needle ? entries.filter((entry) => matches(entry, needle)) : entries;
  }, [entries, query]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (entries.length === 0) {
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

      {shown.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">{tSidebar("noResults")}</p>
      ) : (
        <dl className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 pb-3">
          {shown.map((entry) => (
            <div key={entry.term} className="border-b border-sidebar-border py-2.5 last:border-b-0">
              <dt className="text-sm font-medium leading-snug">
                {entry.term}
                {entry.translation && (
                  <span className="ml-1.5 font-normal text-muted-foreground">· {entry.translation}</span>
                )}
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{entry.coreIdea}</dd>
              {entry.definedOnPage !== null && (
                <dd>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onPageSelect(entry.definedOnPage as number)}
                    className="h-auto px-0 text-xs"
                  >
                    {t("definedOn", { page: entry.definedOnPage })}
                  </Button>
                </dd>
              )}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
