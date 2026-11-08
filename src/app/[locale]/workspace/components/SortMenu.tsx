import { useTranslations } from "next-intl";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortBy } from "@/app/[locale]/workspace/lib/view-mode";

const SORT_OPTIONS: SortBy[] = ["date", "name"];

// The trigger names the current order, so it can be read without opening the menu.
export const SortMenu: React.FC<{ value: SortBy; onChange: (value: SortBy) => void }> = ({ value, onChange }) => {
  const t = useTranslations("workspace.sort");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("label", { order: t(value) })}>
          <ArrowUpDown className="size-3.5" />
          <span className="hidden lg:inline">{t(value)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("title")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as SortBy)}>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
