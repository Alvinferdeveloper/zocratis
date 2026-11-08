import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import type { WorkspaceLocation } from "@/app/[locale]/workspace/hooks/useWorkspaceLocation";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionSwatch } from "@/app/[locale]/workspace/components/CollectionSwatch";

interface Crumb {
  id: string;
  label: string;
  href: string;
  swatch?: string;
}

// Where the user is, as the screen's title: each ancestor is a link, the last one is the heading.
export const WorkspaceBreadcrumb: React.FC<{ location: WorkspaceLocation; count: number }> = ({ location, count }) => {
  const t = useTranslations("workspace.header");
  const { topicId, topic, folderPath } = location;

  if (topicId && !topic) return <Skeleton className="h-5 w-40" />;

  const crumbs: Crumb[] = topic
    ? [
        { id: topic.id, label: topic.name, href: ROUTES.workspaceCollection(topic.id), swatch: topic.color },
        ...folderPath.map((folder) => ({ id: folder.id, label: folder.name, href: ROUTES.workspaceCollection(topic.id, folder.id) })),
      ]
    : [{ id: "recent", label: t("recent"), href: ROUTES.workspace }];

  const ancestors = crumbs.slice(0, -1);
  const current = crumbs[crumbs.length - 1];

  return (
    <nav aria-label={t("breadcrumb")} className="flex min-w-0 items-center gap-1.5">
      {ancestors.map((crumb) => (
        <Fragment key={crumb.id}>
          <Link
            href={crumb.href}
            className="flex max-w-40 shrink items-center gap-2 truncate rounded-md px-1 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {crumb.swatch && <CollectionSwatch color={crumb.swatch} />}
            <span className="truncate">{crumb.label}</span>
          </Link>
          <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/60" />
        </Fragment>
      ))}
      <h1 aria-current="page" className="flex min-w-0 items-center gap-2 px-1 text-lg font-semibold tracking-tight text-foreground">
        {current.swatch && <CollectionSwatch color={current.swatch} />}
        <span className="truncate">{current.label}</span>
      </h1>
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        <span className="sr-only">{t("itemCount", { count })}</span>
        <span aria-hidden>{count}</span>
      </span>
    </nav>
  );
};
