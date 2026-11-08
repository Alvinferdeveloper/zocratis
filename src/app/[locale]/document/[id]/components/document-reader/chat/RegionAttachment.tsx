"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// Redraws a region of the open document as an image; null until the PDF has loaded.
export const RegionRendererContext = createContext<((region: PageRegion) => Promise<string>) | null>(null);

interface RegionAttachmentProps {
  region: PageRegion;
  // The region's label, as quoted in the message ("Figura · pág. 2").
  label: string;
  onSelect: (region: PageRegion) => void;
}

// The figure, table or formula a question was about, attached to the message like a file: redrawn
// from the PDF (messages store only where it is), and a way back to it in the document.
export const RegionAttachment: React.FC<RegionAttachmentProps> = ({ region, label, onSelect }) => {
  const t = useTranslations("chat");
  const render = useContext(RegionRendererContext);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!render) return;
    let cancelled = false;
    render(region)
      .then((dataUrl) => !cancelled && setImage(dataUrl))
      .catch((error) => console.error("Failed to redraw the message's region", error));
    return () => {
      cancelled = true;
    };
  }, [render, region]);

  return (
    <button
      type="button"
      onClick={() => onSelect(region)}
      className="press-feedback group flex max-w-[85%] items-center gap-3 rounded-xl border border-border bg-card p-1.5 pr-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {image && (
          // Data URL of the region: next/image has nothing to optimise here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-contain" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
          {t("showInDocument")}
          <ArrowUpRight className="size-3" />
        </span>
      </span>
    </button>
  );
};
