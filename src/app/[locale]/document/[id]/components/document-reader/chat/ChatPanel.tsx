"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, History, SquarePen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Annotation, ChatSource } from "@/app/types";
import type { UseChatSessionReturn } from "@/app/[locale]/document/[id]/hooks/useChatSession";
import type { UseChatNotesReturn } from "@/app/[locale]/document/[id]/hooks/useChatNotes";
import { IconButton } from "@/components/ui/icon-button";
import { TextQuote } from "@/app/[locale]/document/[id]/components/document-reader/shared/TextQuote";
import { PromptComposer } from "@/app/[locale]/document/[id]/components/document-reader/shared/PromptComposer";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatEmptyState } from "./ChatEmptyState";
import { ConversationHistory } from "./ConversationHistory";

interface ChatPanelProps {
  session: UseChatSessionReturn;
  onClose: () => void;
  onSourceSelect: (source: ChatSource) => void;
  chatNotes: UseChatNotesReturn;
  onNoteOpen: (note: Annotation) => void;
}

type PanelView = "chat" | "history";

const viewTransition = "flex min-h-0 flex-1 flex-col animate-in fade-in duration-200 ease-[var(--ease-out)]";

export const ChatPanel: React.FC<ChatPanelProps> = ({ session, onClose, onSourceSelect, chatNotes, onNoteOpen }) => {
  const t = useTranslations("chat");
  const [view, setView] = useState<PanelView>("chat");
  const isBusy = session.status === "submitted" || session.status === "streaming";
  const isEmptyDraft = !session.activeConversation && session.messages.length === 0;

  const startNewConversation = () => {
    session.startNewConversation();
    setView("chat");
  };

  const headerActions = (
    <>
      <IconButton label={t("panel.newConversation")} onClick={startNewConversation} disabled={isEmptyDraft && view === "chat"}>
        <SquarePen />
      </IconButton>
      <IconButton label={t("panel.close")} onClick={onClose}>
        <X />
      </IconButton>
    </>
  );

  return (
    <section aria-label={t("panel.label")} className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {view === "history" ? (
        <div key="history" className={cn(viewTransition, "slide-in-from-left-2")}>
          <ChatPanelHeader
            leading={
              <IconButton label={t("panel.backToChat")} onClick={() => setView("chat")}>
                <ArrowLeft />
              </IconButton>
            }
            title={t("panel.conversationsTitle")}
            actions={headerActions}
          />
          <ConversationHistory
            conversations={session.conversations}
            isLoading={session.isLoadingConversations}
            activeConversationId={session.activeConversation?.id ?? null}
            onSelect={(id) => {
              session.selectConversation(id);
              setView("chat");
            }}
            onRename={session.renameConversation}
            onDelete={session.deleteConversation}
          />
        </div>
      ) : (
        <div key="chat" className={cn(viewTransition, "slide-in-from-right-2")}>
          <ChatPanelHeader
            leading={
              <IconButton label={t("panel.viewConversations")} onClick={() => setView("history")}>
                <History />
              </IconButton>
            }
            title={session.activeConversation?.title ?? t("panel.newConversation")}
            actions={headerActions}
          />
          <ChatMessageList
            key={session.activeConversation?.id ?? "draft"}
            messages={session.messages}
            status={session.status}
            errorKey={session.errorKey}
            isLoadingHistory={session.isLoadingHistory}
            emptyState={<ChatEmptyState onPromptSelect={session.send} />}
            onRetry={session.retry}
            onSuggestionSelect={session.send}
            onSourceSelect={onSourceSelect}
            chatNotes={chatNotes}
            onNoteOpen={onNoteOpen}
          />
          <div className="shrink-0 px-3 pb-3">
            <PromptComposer
              label={t("composer.label")}
              placeholder={t(session.context ? "composer.selectionPlaceholder" : "composer.documentPlaceholder")}
              isBusy={isBusy}
              onSubmit={session.send}
              onStop={session.stop}
              focusKey={session.context}
              header={
                session.context && (
                  <TextQuote
                    text={session.context.text}
                    caption={t("pageCaption", { page: session.context.page })}
                    onRemove={session.clearContext}
                  />
                )
              }
              className="mx-auto max-w-[68ch]"
            />
          </div>
        </div>
      )}
    </section>
  );
};
