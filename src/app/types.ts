export interface Document {
    id: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string | null;
    fileSize: string;
    topicId: string | null;
    folderId: string | null;
    tags: string[];
    isStarred: boolean;
    pageCount: number | null;
    // Reading progress; null until the document is first read.
    lastPage: number | null;
    furthestPage: number | null;
    type: 'document';
}

export interface Folder {
    id: string;
    name: string;
    color: string;
    topicId: string | null;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    count: number;
    subfoldersCount: number;
    totalSize: string;
    isStarred: boolean;
    type: 'folder';
    subfolders?: Folder[];
    documents?: Document[];
}

export interface Topic {
    id: string;
    name: string;
    color: string;
    count: number;
}

// A passage an assistant reply was grounded on; the reply cites it as [n], its 1-based position.
export interface ChatSource {
    pageNumber: number;
    content: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources: ChatSource[] | null;
    createdAt: string;
}

export interface Conversation {
    id: string;
    documentId: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface AnnotationRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    pageNumber: number;
}

export interface BoundingRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    pageNumber: number;
}

// A highlighted passage, or a chat reply saved against a page (no boundingRect, empty rects).
export type AnnotationOrigin = 'selection' | 'chat';

export interface Annotation {
    id: string;
    selectedText: string;
    comment: string | null;
    aiResponse: string | null;
    color: string;
    pageNumber: number;
    origin: AnnotationOrigin;
    boundingRect: BoundingRect | null;
    rects: AnnotationRect[];
    embedding: string | null;
    documentId: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Language Mode / Vocabulary ─────────────────────────────────────────

export type LanguageCode = 'en' | 'es'; // extend here when adding more languages

export interface LanguageOption {
    code: LanguageCode;
    /** ISO 3166-1 alpha-2 country code, used to build the flagcdn.com flag image URL. */
    countryCode: string;
}

// Display names live in the "vocabulary.languages" messages.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'en', countryCode: 'GB' },
    { code: 'es', countryCode: 'ES' },
];

export const getLanguageOption = (code: LanguageCode): LanguageOption | undefined =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code);

export const isSupportedLanguage = (code: string): code is LanguageCode =>
    SUPPORTED_LANGUAGES.some((l) => l.code === code);

export interface VocabularyMeaning {
    partOfSpeech?: string;
    definition: string;
    exampleSentence: string;
    exampleTranslation?: string;
}

export interface VocabularyConfusable {
    word: string;
    explanation: string;
}

export interface VocabularyExplanation {
    word: string;
    // The selected text, when the card explains its equivalent in another language.
    sourceText?: string;
    wordLanguage: string;
    explanationLanguage: string;
    phonetic?: string;
    meanings: VocabularyMeaning[];
    confusables?: VocabularyConfusable[];
    tip?: string;
    synonyms?: string[];
}

export interface VocabularyEntry {
    id: string;
    selectedText: string;
    wordLanguage: string;
    explanationLanguage: string;
    color: string;
    pageNumber: number;
    boundingRect: BoundingRect;
    rects: AnnotationRect[];
    explanation: VocabularyExplanation | null;
    documentId: string;
    createdAt: string;
    updatedAt: string;
}
