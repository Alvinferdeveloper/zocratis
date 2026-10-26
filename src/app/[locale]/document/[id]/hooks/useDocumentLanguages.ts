import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { isSupportedLanguage, LanguageCode, LanguageOption, SUPPORTED_LANGUAGES } from "@/app/types";
import { UseQuickTranslateReturn } from "@/app/[locale]/document/[id]/hooks/useQuickTranslate";

const MIN_SELECTION_LENGTH_FOR_LOCK = 4;
const FALLBACK_STORAGE_KEY = "quickTranslate:fallbackLanguage";
// Used when the UI language isn't (yet) one of the translation languages, which grow independently.
const DEFAULT_READER_LANGUAGE: LanguageCode = "en";

/**
 * Single source of truth for the two languages in play: the reader's own
 * (the UI language the user chose) and the document's (locked from Quick Translate's first
 * trustworthy detection). Also owns the global fallback-target preference
 * used when the two happen to coincide.
 */
export const useDocumentLanguages = (
  selectedText: string | null,
  quickTranslate: UseQuickTranslateReturn
) => {
  const uiLocale = useLocale();
  const readerLanguage: LanguageCode = isSupportedLanguage(uiLocale) ? uiLocale : DEFAULT_READER_LANGUAGE;

  const [lockedDocumentLanguage, setLockedDocumentLanguage] = useState<LanguageCode | null>(null);
  const lastSelectionLengthRef = useRef(0);

  useEffect(() => {
    lastSelectionLengthRef.current = selectedText?.trim().length ?? 0;
  }, [selectedText]);

  useEffect(() => {
    if (lockedDocumentLanguage) return;
    if (lastSelectionLengthRef.current < MIN_SELECTION_LENGTH_FOR_LOCK) return;
    const detected = quickTranslate.detectedSourceLanguage?.toLowerCase();
    if (detected && isSupportedLanguage(detected)) setLockedDocumentLanguage(detected);
  }, [quickTranslate.detectedSourceLanguage]);

  const isDocumentLocked = lockedDocumentLanguage !== null;
  const documentLanguage: LanguageCode = lockedDocumentLanguage ?? "en";

  const [fallbackTarget, setFallbackTargetState] = useState<LanguageCode>(
    readerLanguage === "en" ? "es" : "en"
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) setFallbackTargetState(stored);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const setFallbackTarget = useCallback((code: LanguageCode) => {
    setFallbackTargetState(code);
    try {
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, code);
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, []);

  // Only gate on isDocumentLocked, never compare the raw unlocked placeholder — it can coincide with readerLanguage before anything is actually known.
  const isFallbackActive = isDocumentLocked && documentLanguage === readerLanguage;

  // Shared by Quick Translate and Explicar: normally the reader's language (fixed, nothing to pick);
  // becomes the editable fallback once the document is confirmed to be the reader's own language.
  const target: LanguageCode = isFallbackActive ? fallbackTarget : readerLanguage;

  // The language Explicar teaches: the document's own normally, or the target when studying
  // the target-language equivalent of a word written in the reader's language.
  const explainWordLanguage: LanguageCode = isFallbackActive ? target : documentLanguage;

  const availableFallbackTargets: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
    (l) => l.code !== readerLanguage
  );

  return {
    readerLanguage,
    documentLanguage,
    target,
    explainWordLanguage,
    isFallbackActive,
    fallbackTarget,
    setFallbackTarget,
    availableFallbackTargets,
  };
};
