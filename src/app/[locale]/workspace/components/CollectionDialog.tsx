import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CollectionColorPicker } from "@/app/[locale]/workspace/components/CollectionColorPicker";
import { DEFAULT_COLLECTION_COLOR } from "@/app/[locale]/workspace/lib/collection-colors";

interface CollectionDialogProps {
  // Collections and folders share the form; only the copy differs.
  kind: "topic" | "folder";
  onSubmit: (values: { name: string; color: string }) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CollectionDialog: React.FC<CollectionDialogProps> = ({ kind, onSubmit, trigger, open, onOpenChange }) => {
  const t = useTranslations(`workspace.${kind}Dialog`);
  const tCommon = useTranslations("common.actions");
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLLECTION_COLOR);
  const isOpen = open ?? internalOpen;

  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setName("");
      setColor(DEFAULT_COLLECTION_COLOR);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <Field id={`${kind}-name`} label={t("nameLabel")}>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("namePlaceholder")} autoFocus />
          </Field>

          <CollectionColorPicker selectedColor={color} onColorChange={setColor} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
