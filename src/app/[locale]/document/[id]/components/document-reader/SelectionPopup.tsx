
import { motion } from "motion/react";
import { GraduationCap, MessageSquare, StickyNote, Languages, Layers, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SelectionPopupProps {
    selectedText: string | null;
    mode?: "notes" | "language";
    onChatClick: () => void;
    onCreateNoteClick: () => void;
    // Language mode explains a word on the vocabulary card; notes mode explains the passage.
    onExplainClick: (anchor: Element) => void;
    onTeachClick: () => void;
    onCreateCardClick: (anchor: Element) => void;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
    selectedText,
    mode = "notes",
    onChatClick,
    onCreateNoteClick,
    onExplainClick,
    onTeachClick,
    onCreateCardClick,
}) => {
    const t = useTranslations("reader.selectionPopup");

    if (!selectedText) return null;

    const isLanguageMode = mode === "language";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="flex items-center gap-0.5 rounded-full border border-border/60 bg-card/95 p-1 shadow-float backdrop-blur-md"
            onMouseDown={(e) => e.preventDefault()}
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={onChatClick}
                className="gap-1.5 text-foreground"
            >
                <MessageSquare className="size-3.5" />
                {t("chat")}
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onExplainClick(e.currentTarget)}
                className="gap-1.5 text-foreground"
            >
                {isLanguageMode ? <Languages className="size-3.5" /> : <Lightbulb className="size-3.5" />}
                {t("explain")}
            </Button>
            {!isLanguageMode && (
                <Button variant="ghost" size="sm" onClick={onTeachClick} className="gap-1.5 text-foreground">
                    <GraduationCap className="size-3.5" />
                    {t("teach")}
                </Button>
            )}
            {!isLanguageMode && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCreateNoteClick}
                    className="gap-1.5 text-foreground"
                >
                    <StickyNote className="size-3.5" />
                    {t("note")}
                </Button>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onCreateCardClick(e.currentTarget)}
                className="gap-1.5 text-foreground"
            >
                <Layers className="size-3.5" />
                {t("card")}
            </Button>
        </motion.div>
    );
}
