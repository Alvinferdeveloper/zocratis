"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Group, Panel } from "react-resizable-panels";
import { useDocumentViewer } from "@/app/[locale]/document/[id]/hooks/useDocumentViewer";
import { useExamMode } from "@/app/[locale]/document/[id]/hooks/useExamMode";
import { useReadingProgress } from "@/app/[locale]/document/[id]/hooks/useReadingProgress";
import { useDocumentIndexing } from "@/app/[locale]/document/[id]/hooks/useDocumentIndexing";
import { useTextSelection } from "@/app/[locale]/document/[id]/hooks/useTextSelection";
import { useChatSession } from "@/app/[locale]/document/[id]/hooks/useChatSession";
import { useChatNotes } from "@/app/[locale]/document/[id]/hooks/useChatNotes";
import { useAnnotationActions } from "@/app/[locale]/document/[id]/hooks/useAnnotationActions";
import { useVocabularyActions } from "@/app/[locale]/document/[id]/hooks/useVocabularyActions";
import { useLanguageMode } from "@/app/[locale]/document/[id]/hooks/useLanguageMode";
import { useVisualQuery } from "@/app/[locale]/document/[id]/hooks/useVisualQuery";
import { useQuickTranslate } from "@/app/[locale]/document/[id]/hooks/useQuickTranslate";
import { useDocumentLanguages } from "@/app/[locale]/document/[id]/hooks/useDocumentLanguages";
import { LiveAnchorTarget } from "@/app/[locale]/document/[id]/hooks/useLiveAnchor";
import { captureRegion, type PageRegion } from "@/app/[locale]/document/[id]/lib/region-image";
import { getSelectionAnchor } from "@/app/[locale]/document/[id]/lib/selection-anchor";
import { ResizeHandle } from "@/components/ui/resize-handle";

import { Header } from "@/app/[locale]/document/[id]/components/document-reader/Header";
import { PdfControls } from "@/app/[locale]/document/[id]/components/document-reader/PdfControls";
import { ResumeNotice } from "@/app/[locale]/document/[id]/components/document-reader/ResumeNotice";
import { PdfViewer, PdfHighlightItem, type PdfNavigation } from "@/app/[locale]/document/[id]/components/document-reader/PdfViewer";
import { ReaderSidebar, SIDEBAR_TABS, type SidebarTab } from "@/app/[locale]/document/[id]/components/document-reader/sidebar/ReaderSidebar";
import type { SidebarHighlight } from "@/app/[locale]/document/[id]/lib/sidebar-highlights";
import { useStoredChoice } from "@/hooks/useStoredChoice";
import { useReaderSearch } from "@/app/[locale]/document/[id]/hooks/useReaderSearch";
import type { TextSearchResult } from "@/app/[locale]/document/[id]/hooks/useDocumentTextSearch";
import type { SemanticPassage } from "@/app/[locale]/document/[id]/hooks/useSemanticSearch";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import { useStoredBoolean } from "@/hooks/useStoredBoolean";
import { ChatPanel } from "@/app/[locale]/document/[id]/components/document-reader/chat";
import { AddWordsToDeckButton } from "@/app/[locale]/document/[id]/components/flashcards/components/AddWordsToDeckButton";
import { SelectionCardPopover, type CardSelection } from "@/app/[locale]/document/[id]/components/flashcards/components/SelectionCardPopover";
import { ExamSetupPanel } from "@/app/[locale]/document/[id]/components/exam/ExamSetupPanel";
import { SelectionPopup } from "@/app/[locale]/document/[id]/components/document-reader/SelectionPopup";
import { QuickTranslateBubble } from "@/app/[locale]/document/[id]/components/document-reader/QuickTranslateBubble";
import { NoteDialog } from "@/app/[locale]/document/[id]/components/document-reader/note-ui";
import { VocabularyCard } from "@/app/[locale]/document/[id]/components/document-reader/language-ui";
import { ExplainCard, type ExplainSelection } from "@/app/[locale]/document/[id]/components/document-reader/explain-ui";
import { DEFAULT_NOTE_COLOR } from "@/app/[locale]/document/[id]/lib/note-colors";
import { VisualQueryPanel } from "@/app/[locale]/document/[id]/components/document-reader/VisualQueryPanel";
import { DocumentFile } from "@/app/[locale]/document/[id]/page";
import { Annotation, BoundingRect, VocabularyEntry } from "@/app/types";
import { getApiErrorKey } from "@/lib/api-errors";
import { useTrackOnMount } from "@/lib/product-events";

// A passage's opening words are enough to find it on its page; if they aren't, the jump still lands on the page.
const PASSAGE_OPENING_WORDS = 8;

interface DocumentReaderProps {
    document: DocumentFile;
    requestedPage?: number;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({ document, requestedPage }) => {
    const {
        currentPage,
        numPages,
        scale,
        pdfScale,
        setCurrentPage,
        setNumPages,
        zoomIn,
        zoomOut,
    } = useDocumentViewer();

    useTrackOnMount("reader_opened", { documentId: document.id });
    const exam = useExamMode();
    const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
    const [isThumbnailsOpen, toggleThumbnails] = useStoredBoolean("reader:thumbnailsOpen");
    const navigationRef = useRef<PdfNavigation>(null);

    // Reopen where the reader left off, unless a link asked for a page; progress is only saved once that page is on screen.
    const resumePage = !requestedPage && document.lastPage && document.lastPage > 1 ? document.lastPage : undefined;
    const [isViewerReady, setIsViewerReady] = useState(false);
    const [isResumeNoticeOpen, setIsResumeNoticeOpen] = useState(false);
    useReadingProgress({ documentId: document.id, currentPage, enabled: isViewerReady });
    const indexing = useDocumentIndexing(document.id);
    const [sidebarTab, setSidebarTab] = useStoredChoice<SidebarTab>("reader:sidebarTab", SIDEBAR_TABS, "pages");
    const search = useReaderSearch(document.id, pdfDoc, indexing);
    const [searchFocusRequest, setSearchFocusRequest] = useState(0);

    // The browser's own find misses pages pdf.js hasn't drawn, so in the reader Ctrl/Cmd+F opens ours.
    useEffect(() => {
        const openSearch = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "f" || exam.enabled) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target?.closest("input, textarea, [contenteditable='true']") && !target.closest("[data-reader-search]")) return;
            event.preventDefault();
            if (!isThumbnailsOpen) toggleThumbnails();
            setSidebarTab("search");
            setSearchFocusRequest((count) => count + 1);
        };
        window.addEventListener("keydown", openSearch);
        return () => window.removeEventListener("keydown", openSearch);
    }, [exam.enabled, isThumbnailsOpen, toggleThumbnails, setSidebarTab]);

    useEffect(() => {
        navigationRef.current?.clearTextMatch();
    }, [search.query, search.mode]);

    const handleSearchResultSelect = (result: TextSearchResult) => {
        search.setActiveResultId(result.id);
        navigationRef.current?.showTextMatch(result.pageNumber, search.exactQuery, result.occurrence);
    };

    // Semantic search results and chat sources: a passage known by its page and text.
    const handlePassageSelect = useCallback((passage: Pick<SemanticPassage, "content" | "pageNumber">) => {
        const opening = passage.content.split(/\s+/).slice(0, PASSAGE_OPENING_WORDS).join(" ");
        navigationRef.current?.showTextMatch(passage.pageNumber, opening, 0);
    }, []);

    const handleViewerReady = useCallback(() => {
        setIsViewerReady(true);
        if (resumePage) setIsResumeNoticeOpen(true);
    }, [resumePage]);
    const dismissResumeNotice = useCallback(() => setIsResumeNoticeOpen(false), []);
    const startOver = () => {
        navigationRef.current?.goToPage(1);
        dismissResumeNotice();
    };

    // In exam mode a thumbnail also selects its page, like clicking the page itself.
    const handleThumbnailClick = (pageNumber: number) => {
        if (exam.enabled) exam.togglePage(pageNumber);
        navigationRef.current?.goToPage(pageNumber);
    };

    const chat = useChatSession({ documentId: document.id });

    const {
        selectedText,
        selectionRects,
        selectedPage,
        handleTextSelection,
        clearSelection,
    } = useTextSelection();

    const languageMode = useLanguageMode(document.id);

    // Instant translation popup on any selection, any mode.
    const quickTranslate = useQuickTranslate();
    const lang = useDocumentLanguages(selectedText, quickTranslate);

    useEffect(() => {
        if (selectedText) {
            quickTranslate.translate(selectedText, lang.target);
        } else {
            quickTranslate.clear();
        }
        // Only the selected text / target should re-trigger a translation.
    }, [selectedText, lang.target]);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);

    const {
        annotations,
        handleColorChange,
        handleSaveNote,
        handleDeleteNote,
    } = useAnnotationActions({
        documentId: document.id,
        currentPage,
        selectionRects,
        selectedPage,
    });

    const handleChatToggle = () => setIsChatOpen((prev) => !prev);

    const handleAskAboutSelection = () => {
        if (selectedText) chat.attachContext({ text: selectedText, page: selectedPage });
        setIsChatOpen(true);
    };

    const handleNoteDialogOpen = () => {
        setEditingAnnotation(null);
        setIsNoteDialogOpen(true);
    };

    const handleAnnotationClick = (annotation: Annotation) => {
        setEditingAnnotation(annotation);
        setIsNoteDialogOpen(true);
    };

    const chatNotes = useChatNotes(document.id, currentPage);

    // A chat note has no highlight to scroll to: go to its page and open it. The list has the latest edits.
    const openChatNote = (note: Annotation) => {
        navigationRef.current?.goToPage(note.pageNumber);
        handleAnnotationClick(annotations.find((annotation) => annotation.id === note.id) ?? note);
    };

    // The text and page are kept here: the reader's selection can change while the question is being written.
    const [cardSelection, setCardSelection] = useState<CardSelection | null>(null);

    const handleCreateCardClick = (fallbackAnchor: Element) => {
        if (!selectedText) return;
        setCardSelection({ text: selectedText, pageNumber: selectedPage, anchor: getSelectionAnchor(fallbackAnchor) });
    };

    const handleCardPopoverClose = useCallback(() => {
        setCardSelection(null);
        clearSelection();
    }, [clearSelection]);

    // Like the card, the explanation keeps its own copy of the selection while the student explores it.
    const [explainSelection, setExplainSelection] = useState<ExplainSelection | null>(null);

    const handleExplainPassageClick = (fallbackAnchor: Element) => {
        if (!selectedText) return;
        setExplainSelection({ text: selectedText, pageNumber: selectedPage, anchor: getSelectionAnchor(fallbackAnchor) });
    };

    const handleExplainCardClose = useCallback(() => {
        setExplainSelection(null);
        clearSelection();
    }, [clearSelection]);

    // The card reviews the explanation's suggestion before it is saved, anchored where the explanation was.
    const handleExplanationCard = (card: { front: string; back: string }) => {
        if (!explainSelection) return;
        setCardSelection({ ...explainSelection, suggestion: card });
        setExplainSelection(null);
    };

    const handleExplanationToChat = () => {
        if (!explainSelection) return;
        chat.attachContext({ text: explainSelection.text, page: explainSelection.pageNumber });
        setIsChatOpen(true);
        handleExplainCardClose();
    };

    const handleNoteDialogClose = () => {
        setIsNoteDialogOpen(false);
        setEditingAnnotation(null);
        clearSelection();
    };

    // ─── Language Mode (vocabulary study) ───────────────────────────────
    const {
        vocabularyEntries,
        handleColorChange: handleVocabularyColorChange,
        handleSaveEntry,
        handleDeleteEntry,
    } = useVocabularyActions({
        documentId: document.id,
        currentPage,
        selectionRects,
        selectedPage,
    });

    const [isVocabularyCardOpen, setIsVocabularyCardOpen] = useState(false);
    const [editingVocabularyEntry, setEditingVocabularyEntry] = useState<VocabularyEntry | null>(null);
    const [vocabularyAnchor, setVocabularyAnchor] = useState<LiveAnchorTarget | null>(null);
    const [readerViewport, setReaderViewport] = useState<HTMLDivElement | null>(null);

    const handleExplainClick = (fallbackAnchor: Element) => {
        setEditingVocabularyEntry(null);
        setVocabularyAnchor(getSelectionAnchor(fallbackAnchor));
        setIsVocabularyCardOpen(true);
    };

    const handleVocabularyEntryClick = (entry: VocabularyEntry, anchor: Element) => {
        setEditingVocabularyEntry(entry);
        setVocabularyAnchor(anchor);
        setIsVocabularyCardOpen(true);
    };

    const handleVocabularyCardClose = () => {
        setIsVocabularyCardOpen(false);
        setEditingVocabularyEntry(null);
        setVocabularyAnchor(null);
        clearSelection();
    };

    const activeHighlights: PdfHighlightItem[] = languageMode.enabled
        ? vocabularyEntries.map((entry) => ({
              id: entry.id,
              color: entry.color,
              selectedText: entry.selectedText,
              pageNumber: entry.pageNumber,
              boundingRect: entry.boundingRect,
              rects: entry.rects,
          }))
        : annotations
              .filter((annotation): annotation is Annotation & { boundingRect: BoundingRect } => annotation.boundingRect !== null)
              .map((annotation) => ({
                  id: annotation.id,
                  color: annotation.color,
                  selectedText: annotation.selectedText,
                  pageNumber: annotation.pageNumber,
                  boundingRect: annotation.boundingRect,
                  rects: annotation.rects,
              }));

    const handleHighlightClick = (id: string, anchor: Element) => {
        if (languageMode.enabled) {
            const entry = vocabularyEntries.find((e) => e.id === id);
            if (entry) handleVocabularyEntryClick(entry, anchor);
        } else {
            const annotation = annotations.find((a) => a.id === id);
            if (annotation) handleAnnotationClick(annotation);
        }
    };

    // The viewer draws either notes or words, so jumping to the other kind switches mode first and scrolls once it's drawn.
    const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(null);
    const jumpToHighlight = (id: string, isWord: boolean) => {
        if (isWord !== languageMode.enabled) {
            languageMode.toggle();
            setPendingHighlightId(id);
            return;
        }
        navigationRef.current?.scrollToHighlight(id);
    };

    const handleNoteSelect = (item: SidebarHighlight) => {
        const note = annotations.find((annotation) => annotation.id === item.id);
        if (note?.origin === "chat") openChatNote(note);
        else jumpToHighlight(item.id, false);
    };

    useEffect(() => {
        if (pendingHighlightId && navigationRef.current?.scrollToHighlight(pendingHighlightId)) {
            setPendingHighlightId(null);
        }
    }, [pendingHighlightId, activeHighlights]);

    // ─── Visual query (images/formulas on-demand) ──────────────────────
    const [regionMode, setRegionMode] = useState(false);
    const [isVisualQueryOpen, setIsVisualQueryOpen] = useState(false);
    const [pendingRegion, setPendingRegion] = useState<{
        pageNumber: number;
        imageBase64: string;
        text: string;
    } | null>(null);

    const visualQuery = useVisualQuery(document.id);

    const handleToggleRegionMode = () => setRegionMode((prev) => !prev);

    // The AI gets exactly what was cropped, redrawn sharp from the PDF, plus any text inside it.
    const handleRegionSelection = async (region: PageRegion) => {
        if (!pdfDoc) return;
        try {
            const { image, text } = await captureRegion(pdfDoc, region);
            setPendingRegion({ pageNumber: region.pageNumber, imageBase64: image, text });
            setIsVisualQueryOpen(true);
            visualQuery.reset();
        } catch (error) {
            console.error("Failed to capture the selected region", error);
        }
    };

    const handleAskVisualQuery = (question: string) => {
        if (!pendingRegion) return;
        visualQuery.mutate({
            question,
            pageNumber: pendingRegion.pageNumber,
            imageBase64: pendingRegion.imageBase64,
            regionText: pendingRegion.text || undefined,
        });
    };

    const handleVisualQueryClose = () => {
        setIsVisualQueryOpen(false);
        setPendingRegion(null);
        visualQuery.reset();
    };

    return (
        <div className="h-screen bg-background flex flex-col">
            <Header
                fileName={document.fileName}
                documentId={document.id}
                examMode={exam.enabled}
                onToggleExamMode={exam.toggle}
                languageModeEnabled={languageMode.enabled}
                wordLanguage={lang.documentLanguage}
                explanationLanguage={lang.target}
                onToggleLanguageMode={languageMode.toggle}
                isTargetEditable={lang.isFallbackActive}
                availableTargets={lang.availableFallbackTargets}
                onTargetChange={lang.setFallbackTarget}
            />

            <div className="flex-1 overflow-hidden">
                <Group orientation="horizontal" className="h-full">
                    <Panel minSize="40" className="relative flex">
                        {isThumbnailsOpen && pdfDoc && (
                            <ReaderSidebar
                                pdf={pdfDoc}
                                currentPage={currentPage}
                                onPageClick={handleThumbnailClick}
                                selectedPages={exam.enabled ? exam.selectedPages : undefined}
                                compact={isChatOpen || exam.enabled}
                                notes={annotations}
                                words={vocabularyEntries}
                                wordsAction={<AddWordsToDeckButton documentId={document.id} className="mx-2 mb-2 justify-start" />}
                                onNoteSelect={handleNoteSelect}
                                onWordSelect={(word) => jumpToHighlight(word.id, true)}
                                onSectionSelect={(section) => navigationRef.current?.goToPage(section.pageNumber, section.destination)}
                                tab={sidebarTab}
                                onTabChange={setSidebarTab}
                                search={search}
                                searchFocusRequest={searchFocusRequest}
                                onSearchResultSelect={handleSearchResultSelect}
                                onPassageSelect={handlePassageSelect}
                            />
                        )}
                        <div className="relative flex min-w-0 flex-1 flex-col">
                            <PdfControls
                                pageNumber={currentPage}
                                numPages={numPages}
                                scale={scale}
                                isChatOpen={isChatOpen}
                                selectedText={selectedText}
                                onChatToggle={handleChatToggle}
                                onZoomIn={zoomIn}
                                onZoomOut={zoomOut}
                                isThumbnailsOpen={isThumbnailsOpen}
                                onThumbnailsToggle={toggleThumbnails}
                                examMode={exam.enabled}
                                regionMode={regionMode}
                                onRegionModeToggle={handleToggleRegionMode}
                            />
                            <PdfViewer
                                publicUrl={document.publicUrl}
                                scale={pdfScale}
                                highlights={activeHighlights}
                                setNumPages={setNumPages}
                                onTextSelection={handleTextSelection}
                                onPageChange={setCurrentPage}
                                onHighlightClick={handleHighlightClick}
                                regionMode={regionMode}
                                onRegionSelection={handleRegionSelection}
                                viewportRef={setReaderViewport}
                                selectionTip={
                                    <div>
                                        {selectedText && !exam.enabled && !cardSelection && !explainSelection && (
                                            <div key={selectedText} className="flex flex-col items-center gap-1.5">
                                                <QuickTranslateBubble
                                                    translation={quickTranslate.translation}
                                                    isLoading={quickTranslate.isLoading}
                                                />
                                                <SelectionPopup
                                                    selectedText={selectedText}
                                                    mode={languageMode.enabled ? "language" : "notes"}
                                                    onChatClick={handleAskAboutSelection}
                                                    onCreateNoteClick={handleNoteDialogOpen}
                                                    onExplainClick={languageMode.enabled ? handleExplainClick : handleExplainPassageClick}
                                                    onCreateCardClick={handleCreateCardClick}
                                                />
                                            </div>
                                        )}
                                    </div>
                                }
                                examMode={exam.enabled}
                                selectedPages={exam.selectedPages}
                                onPageSelect={exam.togglePage}
                                onPdfLoad={setPdfDoc}
                                navigationRef={navigationRef}
                                initialPage={requestedPage ?? resumePage}
                                onReady={handleViewerReady}
                            />
                            {isResumeNoticeOpen && resumePage && (
                                <ResumeNotice page={resumePage} onStartOver={startOver} onDismiss={dismissResumeNotice} />
                            )}
                        </div>
                    </Panel>

                    {exam.enabled ? (
                        <>
                            <ResizeHandle />
                            <Panel defaultSize="28" minSize="22" maxSize="40">
                                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-200 ease-[var(--ease-out)]">
                                    <ExamSetupPanel
                                        documentId={document.id}
                                        documentName={document.fileName}
                                        selectedPages={exam.selectedPages}
                                        pdfDoc={pdfDoc}
                                        onClose={exam.exit}
                                    />
                                </div>
                            </Panel>
                        </>
                    ) : isChatOpen && (
                        <>
                            <ResizeHandle />
                            <Panel defaultSize="34" minSize="24" maxSize="50">
                                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-200 ease-[var(--ease-out)]">
                                    <ChatPanel
                                        session={chat}
                                        onClose={() => setIsChatOpen(false)}
                                        onSourceSelect={handlePassageSelect}
                                        chatNotes={chatNotes}
                                        onNoteOpen={openChatNote}
                                    />
                                </div>
                            </Panel>
                        </>
                    )}
                </Group>
            </div>

            <NoteDialog
                isOpen={isNoteDialogOpen}
                onClose={handleNoteDialogClose}
                selectedText={editingAnnotation?.selectedText || selectedText || ""}
                documentFileName={document.fileName}
                onSaveNote={async (noteData) => {
                    const saved = await handleSaveNote(noteData, editingAnnotation);
                    setEditingAnnotation(saved);
                    return saved;
                }}
                onDeleteNote={handleDeleteNote}
                onColorChange={(color) =>
                    editingAnnotation
                        ? handleColorChange(editingAnnotation.id, color)
                        : Promise.resolve()
                }
                existingAnnotation={editingAnnotation}
            />

            <VocabularyCard
                isOpen={isVocabularyCardOpen}
                onClose={handleVocabularyCardClose}
                anchor={vocabularyAnchor}
                portalContainer={readerViewport}
                selectedText={editingVocabularyEntry?.selectedText || selectedText || ""}
                wordLanguage={lang.explainWordLanguage}
                explanationLanguage={lang.readerLanguage}
                sourceLanguage={lang.documentLanguage}
                documentFileName={document.fileName}
                onSaveEntry={handleSaveEntry}
                onDeleteEntry={handleDeleteEntry}
                onColorChange={handleVocabularyColorChange}
                onEntryUpdated={setEditingVocabularyEntry}
                existingEntry={editingVocabularyEntry}
            />

            <ExplainCard
                documentId={document.id}
                selection={explainSelection}
                onClose={handleExplainCardClose}
                portalContainer={readerViewport}
                onSaveNote={(markdown) =>
                    handleSaveNote(
                        { selectedText: explainSelection?.text ?? "", comment: "", aiResponse: markdown, color: DEFAULT_NOTE_COLOR },
                        null
                    )
                }
                onCreateCard={handleExplanationCard}
                onContinueInChat={handleExplanationToChat}
                onGoToPage={(page) => navigationRef.current?.goToPage(page)}
            />

            <SelectionCardPopover
                documentId={document.id}
                selection={cardSelection}
                onClose={handleCardPopoverClose}
                portalContainer={readerViewport}
            />

            <VisualQueryPanel
                isOpen={isVisualQueryOpen}
                onClose={handleVisualQueryClose}
                previewImage={pendingRegion?.imageBase64 ?? null}
                isLoading={visualQuery.isPending}
                answer={visualQuery.data ?? null}
                errorKey={visualQuery.error && getApiErrorKey(visualQuery.error)}
                onAsk={handleAskVisualQuery}
            />
        </div>
    );
};
