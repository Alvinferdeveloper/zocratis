import { Check, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SaveNoteButtonProps {
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
  onOpen: () => void;
}

// Once saved it stays marked and opens the note instead of saving a copy.
export const SaveNoteButton: React.FC<SaveNoteButtonProps> = ({ isSaving, isSaved, onSave, onOpen }) => {
  const t = useTranslations("chat.assistantMessage");

  if (isSaved) {
    return (
      <Button variant="ghost" size="sm" onClick={onOpen} className="-ml-2.5">
        <Check />
        {t("noteSaved")}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving} className="-ml-2.5">
      <StickyNote />
      {t(isSaving ? "savingNote" : "saveAsNote")}
    </Button>
  );
};
