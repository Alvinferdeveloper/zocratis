import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UpgradePlanLink } from "@/components/upgrade-plan-link";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";

interface WorkspaceEmptyStateProps {
  searchQuery: string;
  isRecent: boolean;
  isUploadBlocked: boolean;
  onUpload: () => void;
}

const SheetStack: React.FC = () => (
  <div aria-hidden className="relative h-[88px] w-24">
    <PaperSheet className="absolute left-2 top-1 -rotate-6 opacity-70" />
    <PaperSheet className="absolute left-6 top-0 rotate-3" />
  </div>
);

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({ searchQuery, isRecent, isUploadBlocked, onUpload }) => {
  const t = useTranslations("workspace");

  if (searchQuery) {
    return <EmptyState title={t("empty.searchTitle", { query: searchQuery })} description={t("empty.searchDescription")} />;
  }

  return (
    <EmptyState
      illustration={<SheetStack />}
      title={isRecent ? t("empty.recentTitle") : t("empty.collectionTitle")}
      description={isRecent ? t("empty.recentDescription") : t("empty.collectionDescription")}
      action={
        isUploadBlocked ? (
          <p className="text-sm text-muted-foreground">
            {t("newMenu.uploadLimitReached")} <UpgradePlanLink />
          </p>
        ) : (
          <>
            <Button onClick={onUpload}>
              <Upload />
              {t("actions.uploadDocument")}
            </Button>
            <span className="text-xs text-muted-foreground">{t("empty.dropHint")}</span>
          </>
        )
      }
    />
  );
};
