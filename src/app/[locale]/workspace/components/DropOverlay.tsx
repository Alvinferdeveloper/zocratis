import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { PaperSheet } from "@/app/[locale]/workspace/components/PaperSheet";

interface DropOverlayProps {
  isVisible: boolean;
  // Where the dropped files will land; none means outside any collection.
  destination?: string;
}

// While a file is dragged over the window: the page recedes behind the scrim and says where the PDFs will go.
export const DropOverlay: React.FC<DropOverlayProps> = ({ isVisible, destination }) => {
  const t = useTranslations("workspace.drop");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-scrim"
        >
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-14 py-10 text-center shadow-float">
            <PaperSheet bookmarked className="-rotate-3" />
            <div>
              <p className="text-base font-medium text-foreground">{t("title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {destination ? t("into", { place: destination }) : t("noCollection")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
