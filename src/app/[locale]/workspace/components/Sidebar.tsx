import { useTranslations } from "next-intl";
import { Clock, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { IconButton } from "@/components/ui/icon-button";
import { NavItem } from "@/components/ui/nav-item";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ReviewNavLink } from "@/app/[locale]/review/components/ReviewNavLink";
import { useFetchTopics } from "@/app/[locale]/workspace/hooks/useFetchTopics";
import { useCreateTopic } from "@/app/[locale]/workspace/hooks/useCreateTopic";
import type { WorkspaceLocation } from "@/app/[locale]/workspace/hooks/useWorkspaceLocation";
import { TopicList } from "@/app/[locale]/workspace/components/TopicList";
import { CollectionDialog } from "@/app/[locale]/workspace/components/CollectionDialog";
import { StorageQuota } from "@/app/[locale]/workspace/components/StorageQuota";

interface SidebarProps {
  location: WorkspaceLocation;
  // The "New" menu, owned by the page because it shares the upload with drag and drop.
  newMenu: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ location, newMenu }) => {
  const t = useTranslations("workspace");
  const { data: topics } = useFetchTopics();
  const { mutate: createTopic } = useCreateTopic();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-4 pt-4">
        <Link href={ROUTES.workspace} className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandLogo className="text-base text-foreground" />
        </Link>
      </div>

      <div className="px-3 pt-5">{newMenu}</div>

      <nav aria-label={t("sidebar.navigation")} className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <div className="space-y-0.5">
          <NavItem asChild isActive={!location.topicId}>
            <Link href={ROUTES.workspace}>
              <Clock />
              {t("sidebar.recent")}
            </Link>
          </NavItem>
          <ReviewNavLink />
        </div>

        <div className="mb-1 mt-7 flex items-center justify-between pl-2.5">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{t("sidebar.collections")}</h2>
          <CollectionDialog
            kind="topic"
            onSubmit={createTopic}
            trigger={
              <IconButton size="icon-sm" label={t("topicDialog.trigger")}>
                <Plus className="size-3.5" />
              </IconButton>
            }
          />
        </div>

        {topics && topics.length > 0 ? (
          <TopicList topics={topics} activeTopicId={location.topicId} />
        ) : (
          <p className="px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground">{t("sidebar.noCollections")}</p>
        )}
      </nav>

      <StorageQuota />
    </aside>
  );
};
