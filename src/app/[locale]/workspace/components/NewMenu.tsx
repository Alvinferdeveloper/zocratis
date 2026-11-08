"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FolderPlus, Plus, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UpgradePlanLink } from "@/components/upgrade-plan-link";
import { CollectionDialog } from "@/app/[locale]/workspace/components/CollectionDialog";

interface NewMenuProps {
  topicId: string | null;
  folderId: string | null;
  createFolder: (folder: { name: string; color: string; topicId: string; parentId?: string }) => void;
  onUpload: () => void;
  isUploadBlocked: boolean;
}

const MenuHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-2 pb-1.5 pt-0.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
);

export const NewMenu: React.FC<NewMenuProps> = ({ topicId, folderId, createFolder, onUpload, isUploadBlocked }) => {
  const t = useTranslations("workspace");
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  return (
    <>
      {/* Non-modal, so the folder dialog it opens gets focus instead of fighting the closing menu for it. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="w-full">
            <Plus />
            {t("newMenu.new")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
          <DropdownMenuItem disabled={isUploadBlocked} onSelect={onUpload}>
            <Upload />
            {t("actions.uploadDocument")}
          </DropdownMenuItem>
          {isUploadBlocked && (
            <MenuHint>
              {t("newMenu.uploadLimitReached")} <UpgradePlanLink />
            </MenuHint>
          )}
          <DropdownMenuItem disabled={!topicId} onSelect={() => setShowFolderDialog(true)}>
            <FolderPlus />
            {t("newMenu.newFolder")}
          </DropdownMenuItem>
          {!topicId && <MenuHint>{t("newMenu.folderNeedsCollection")}</MenuHint>}
        </DropdownMenuContent>
      </DropdownMenu>

      {topicId && (
        <CollectionDialog
          kind="folder"
          open={showFolderDialog}
          onOpenChange={setShowFolderDialog}
          onSubmit={({ name, color }) => createFolder({ name, color, topicId, parentId: folderId ?? undefined })}
        />
      )}
    </>
  );
};
