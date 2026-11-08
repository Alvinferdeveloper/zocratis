"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import { captureRegion, type PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import type { DocumentRegion } from "@/app/[locale]/document/[id]/lib/page-regions";
import { toPageRegion } from "@/app/[locale]/document/[id]/lib/page-regions";

// Sharp enough to zoom in on small print without upscaling.
const ENLARGED_SIZE_PX = 2800;
const ZOOM_STEPS = [1, 1.5, 2, 3];

interface RegionLightboxProps {
  pdf: PdfDocument | null;
  region: DocumentRegion | null;
  onClose: () => void;
  onExplain: (region: DocumentRegion) => void;
}

// A detected figure, table or formula seen up close, redrawn from the PDF at high resolution.
export const RegionLightbox: React.FC<RegionLightboxProps> = ({ pdf, region, onClose, onExplain }) => {
  const t = useTranslations("reader.regions");
  const tExplain = useTranslations("reader.explain");
  const [image, setImage] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    setImage(null);
    setZoomIndex(0);
    if (!pdf || !region) return;
    let cancelled = false;
    captureRegion(pdf, toPageRegion(region), ENLARGED_SIZE_PX)
      .then(({ image: dataUrl }) => !cancelled && setImage(dataUrl))
      .catch((error) => console.error("Failed to enlarge the region", error));
    return () => {
      cancelled = true;
    };
  }, [pdf, region]);

  const zoom = ZOOM_STEPS[zoomIndex];
  const label = region ? tExplain("regionLabel", { kind: region.kind, page: region.pageNumber }) : "";

  return (
    <Dialog open={region !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[min(64rem,calc(100vw-2rem))] max-w-none flex-col gap-3 p-4 sm:max-w-none">
        <div className="flex items-center gap-2 pr-10">
          <DialogTitle className="flex-1 truncate">{label}</DialogTitle>
          <IconButton
            label={t("zoomOut")}
            onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
            disabled={zoomIndex === 0}
          >
            <Minus />
          </IconButton>
          <span className="w-10 text-center font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            label={t("zoomIn")}
            onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
          >
            <Plus />
          </IconButton>
          {region && (
            <Button size="sm" onClick={() => onExplain(region)} className="ml-1">
              <Lightbulb />
              {t("explain")}
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin rounded-lg bg-muted">
          {image ? (
            // Data URL of the region: next/image has nothing to optimise here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={label}
              onDoubleClick={() => setZoomIndex((index) => (index === 0 ? 2 : 0))}
              style={{ width: `${zoom * 100}%` }}
              className="mx-auto block max-w-none cursor-zoom-in"
            />
          ) : (
            <Skeleton className="h-80 w-full rounded-lg" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
