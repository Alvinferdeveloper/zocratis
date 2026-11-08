"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_LABELS } from "@/i18n/routing";
import { useLocaleSwitch } from "@/i18n/useLocaleSwitch";

// Language picker as a nested entry inside an existing dropdown menu (e.g. the user menu).
export const LocaleSubmenu: React.FC = () => {
  const t = useTranslations("common.localeSwitcher");
  const { locale, locales, switchLocale } = useLocaleSwitch();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="mr-2 size-4 text-muted-foreground" />
        <span>{t("label")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-40">
          <DropdownMenuRadioGroup value={locale}>
            {locales.map((option) => (
              <DropdownMenuRadioItem key={option} value={option} onSelect={() => switchLocale(option)}>
                {LOCALE_LABELS[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
