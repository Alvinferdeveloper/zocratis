"use client"

import * as React from "react"
import { Moon, Sun, LogOut, CreditCard } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useAuth from "@/app/hooks/useAuth"
import { authClient } from "@/app/lib/auth-client"
import { useRouter } from "@/i18n/navigation"
import { useUsage } from "@/app/[locale]/subscription/hooks/useSubscription"
import { ROUTES } from "@/config/routes"
import { LocaleSubmenu } from "@/components/locale/LocaleSubmenu"
import { UsageSummary } from "@/components/usage-summary"

const THEMES = ["light", "dark", "system"] as const;

const getInitials = (name = "U") =>
    name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export function UserProfileMenu() {
    const t = useTranslations("common");
    const { theme, setTheme } = useTheme();
    const { data: session } = useAuth();
    const { data: usage, refetch: refetchUsage } = useUsage();
    const router = useRouter();

    const handleLogOut = () => {
        authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push(ROUTES.home);
                }
            }
        });
    }

    return (
        // Actions refresh usage themselves; reopening also catches a renewal that happened meanwhile.
        <DropdownMenu onOpenChange={(open) => open && refetchUsage()}>
            <DropdownMenuTrigger
                aria-label={t("userMenu.open")}
                className="press-feedback rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Avatar className="border border-border">
                    <AvatarImage src={session?.user?.image || undefined} alt={t("userMenu.avatarAlt")} />
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{getInitials(session?.user?.name)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                        <p className="truncate text-sm font-medium leading-none">{session?.user?.name}</p>
                        <p className="truncate text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                </DropdownMenuLabel>

                {usage && (
                    <>
                        <DropdownMenuSeparator />
                        <UsageSummary usage={usage} />
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push(ROUTES.subscription)}>
                    <CreditCard />
                    <span>{t("actions.upgradePlan")}</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Sun className="mr-2 size-4 text-muted-foreground dark:hidden" />
                        <Moon className="mr-2 hidden size-4 text-muted-foreground dark:block" />
                        <span>{t("theme.label")}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-40">
                            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                {THEMES.map((option) => (
                                    <DropdownMenuRadioItem key={option} value={option}>
                                        {t(`theme.${option}`)}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <LocaleSubmenu />
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogOut}>
                    <LogOut />
                    <span>{t("userMenu.logOut")}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
