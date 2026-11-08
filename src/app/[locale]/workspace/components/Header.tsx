import { useTranslations } from "next-intl";
import { Grid3X3, List } from "lucide-react";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { UserProfileMenu } from "@/components/user-profile-menu";
import type { SortBy, ViewMode } from "@/app/[locale]/workspace/lib/view-mode";
import type { WorkspaceLocation } from "@/app/[locale]/workspace/hooks/useWorkspaceLocation";
import { WorkspaceBreadcrumb } from "@/app/[locale]/workspace/components/WorkspaceBreadcrumb";
import { SortMenu } from "@/app/[locale]/workspace/components/SortMenu";

interface HeaderProps {
  location: WorkspaceLocation;
  itemCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  itemCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  const t = useTranslations("workspace.header");
  const scopeName = location.folder?.name ?? location.topic?.name;

  return (
    <>
      <WorkspaceBreadcrumb location={location} count={itemCount} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <SearchField
          shortcut="/"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={scopeName ? t("searchIn", { name: scopeName }) : t("searchRecent")}
          aria-label={t("search")}
          className="hidden w-56 sm:block"
        />
        <SortMenu value={sortBy} onChange={onSortChange} />
        <SegmentedControl
          size="sm"
          aria-label={t("viewMode")}
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: "list", label: <List className="size-3.5" />, ariaLabel: t("listView") },
            { value: "grid", label: <Grid3X3 className="size-3.5" />, ariaLabel: t("gridView") },
          ]}
        />
        <div aria-hidden className="mx-1.5 h-5 w-px bg-border" />
        <UserProfileMenu />
      </div>
    </>
  );
};
