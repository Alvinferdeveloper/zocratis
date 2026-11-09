
import { GraduationCap, ZoomIn, ZoomOut, ScanSearch, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { ZocratisMark } from "@/components/brand/ZocratisMark";

interface PdfControlsProps {
    pageNumber: number;
    numPages: number | null;
    scale: number;
    isChatOpen: boolean;
    // While explaining from memory the chat stays out of reach.
    isChatDisabled?: boolean;
    selectedText: string | null;
    onChatToggle: () => void;
    isTeachOpen: boolean;
    onTeachToggle: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    isThumbnailsOpen: boolean;
    onThumbnailsToggle: () => void;
    examMode?: boolean;
    regionMode?: boolean;
    onRegionModeToggle?: () => void;
}

export const PdfControls: React.FC<PdfControlsProps> = ({
    pageNumber,
    numPages,
    scale,
    isChatOpen,
    isChatDisabled = false,
    selectedText,
    onChatToggle,
    isTeachOpen,
    onTeachToggle,
    onZoomIn,
    onZoomOut,
    isThumbnailsOpen,
    onThumbnailsToggle,
    examMode = false,
    regionMode = false,
    onRegionModeToggle,
}) => {
    const t = useTranslations("reader.controls");

    return (
        <>
            {/* Floating toolbar: page indicator + zoom */}
            <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-card/90 px-2 py-1.5 shadow-float backdrop-blur-md">
                    <IconButton
                        size="icon-sm"
                        label={t("thumbnails")}
                        onClick={onThumbnailsToggle}
                        aria-pressed={isThumbnailsOpen}
                    >
                        <PanelLeft className="size-3.5" />
                    </IconButton>
                    <div className="h-4 w-px bg-border" />
                    <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
                        {pageNumber || 1} / {numPages || "--"}
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <IconButton size="icon-sm" label={t("zoomOut")} onClick={onZoomOut}>
                        <ZoomOut className="size-3.5" />
                    </IconButton>
                    <span className="min-w-10 text-center text-xs font-medium tabular-nums text-muted-foreground">
                        {Math.round(scale * 100)}%
                    </span>
                    <IconButton size="icon-sm" label={t("zoomIn")} onClick={onZoomIn}>
                        <ZoomIn className="size-3.5" />
                    </IconButton>
                    {!examMode && (
                        <>
                            <div className="h-4 w-px bg-border" />
                            <Button variant="ghost" size="sm" aria-pressed={isTeachOpen} onClick={onTeachToggle} className="h-7">
                                <GraduationCap className="size-3.5" />
                                {t("teach")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Floating region-selection toggle: images/formulas visual query */}
            {!examMode && onRegionModeToggle && (
                <div className="absolute right-40 top-4 z-20">
                    <Button
                        variant={regionMode ? "default" : "outline"}
                        aria-pressed={regionMode}
                        onClick={onRegionModeToggle}
                        title={t("regionQueryHint")}
                        className={cn("h-10 shadow-float", !regionMode && "bg-card/90 backdrop-blur-md")}
                    >
                        <ScanSearch />
                        {t("regionQuery")}
                    </Button>
                </div>
            )}

            {/* Floating "Ask AI" trigger; exam mode takes that side for its setup panel */}
            {!examMode && (
                <div className="absolute right-4 top-4 z-20">
                    <Button
                        variant={isChatOpen ? "default" : "outline"}
                        aria-pressed={isChatOpen}
                        onClick={onChatToggle}
                        disabled={isChatDisabled}
                        className={cn("h-10 shadow-float", !isChatOpen && "bg-card/90 backdrop-blur-md")}
                    >
                        <ZocratisMark className="size-[18px]" />
                        {t("assistant")}
                        {selectedText && !isChatOpen && (
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </>
    );
};
