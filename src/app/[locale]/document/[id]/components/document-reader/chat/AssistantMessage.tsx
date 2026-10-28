import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Components } from "react-markdown";
import type { ChatSource } from "@/app/types";
import { ZocratisMark } from "@/components/brand/ZocratisMark";
import {
  MarkdownLink,
  MarkdownRenderer,
} from "@/app/[locale]/document/[id]/components/document-reader/note-ui/MarkdownRenderer";
import { linkCitations, SOURCE_HREF_PREFIX, splitAssistantText } from "@/app/[locale]/document/[id]/lib/chat-message";
import { PromptList } from "./PromptList";
import { SourceCitation } from "./SourceCitation";

// Only the latest reply carries the mark: animated while it's being written, still once it's done.
export type AssistantMarkState = "hidden" | "idle" | "working";

interface AssistantMessageProps {
  text: string;
  sources: ChatSource[];
  markState: AssistantMarkState;
  showSuggestions: boolean;
  // Rendered under the reply; the article is a `group`, so actions can reveal on hover.
  actions?: React.ReactNode;
  onSuggestionSelect: (suggestion: string) => void;
  onSourceSelect: (source: ChatSource) => void;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  text,
  sources,
  markState,
  showSuggestions,
  actions,
  onSuggestionSelect,
  onSourceSelect,
}) => {
  const t = useTranslations("chat.assistantMessage");
  const { content, suggestions } = splitAssistantText(text);

  const citationComponents = useMemo<Components | undefined>(() => {
    if (sources.length === 0) return undefined;
    return {
      a: ({ href, children }) => {
        const number = href?.startsWith(SOURCE_HREF_PREFIX) ? Number(href.slice(SOURCE_HREF_PREFIX.length)) : 0;
        const source = sources[number - 1];
        return source ? (
          <SourceCitation number={number} source={source} onSelect={onSourceSelect} />
        ) : (
          <MarkdownLink href={href}>{children}</MarkdownLink>
        );
      },
    };
  }, [sources, onSourceSelect]);

  return (
    <article className="group min-w-0">
      <MarkdownRenderer
        content={linkCitations(content, sources.length)}
        components={citationComponents}
        className="px-0"
      />
      {markState !== "hidden" && (
        <ZocratisMark animated={markState === "working"} className="mt-3 size-6 text-primary" />
      )}
      {actions && <div className="mt-2 flex items-center gap-1">{actions}</div>}
      {showSuggestions && suggestions.length > 0 && (
        <PromptList
          label={t("suggestionsLabel")}
          prompts={suggestions}
          onSelect={onSuggestionSelect}
          className="-mx-2 mt-4 border-t border-sidebar-border pt-3"
        />
      )}
    </article>
  );
};
