import { useTranslations } from "next-intl";
import { parseChatMessage } from "@/app/[locale]/document/[id]/lib/chat-message";
import { TextQuote } from "@/app/[locale]/document/[id]/components/document-reader/shared/TextQuote";
import type { PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import { RegionAttachment } from "./RegionAttachment";

interface UserMessageProps {
  text: string;
  region?: PageRegion;
  onRegionSelect: (region: PageRegion) => void;
}

// A question about a region shows the region as an attachment instead of its quoted label.
export const UserMessage: React.FC<UserMessageProps> = ({ text, region, onRegionSelect }) => {
  const t = useTranslations("chat");
  const { context, question } = parseChatMessage(text);

  return (
    <div className="flex flex-col items-end gap-1.5">
      {region && (
        <RegionAttachment region={region} label={context?.text ?? ""} onSelect={onRegionSelect} />
      )}
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2.5 text-[15px] leading-relaxed text-secondary-foreground">
        {context && !region && (
          <TextQuote
            text={context.text}
            caption={t("pageCaption", { page: context.page })}
            className="mb-2 bg-background/70"
          />
        )}
        <p className="whitespace-pre-wrap break-words">{question}</p>
      </div>
    </div>
  );
};
