import type { Document, Folder, Topic } from "@/app/types";

interface ItemProps {
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}

export interface DocumentItemProps extends ItemProps {
  doc: Document;
  // Shown where documents of several collections mix (Recent).
  collection?: Topic;
}

export interface FolderItemProps extends ItemProps {
  folder: Folder;
}
