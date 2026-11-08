import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type referenceMessages from "@/messages/es";
import { Annotation } from "@/app/types";
import { useStreamingNote } from "@/app/[locale]/document/[id]/hooks/useStreamingNote";
import { DEFAULT_NOTE_COLOR } from "@/app/[locale]/document/[id]/lib/note-colors";
import { type ApiErrorKey, getApiErrorKey } from "@/lib/api-errors";

// compose → generating → viewing ⇄ revising → reviewing → viewing
export type NotePhase = "compose" | "generating" | "viewing" | "revising" | "reviewing";

export interface NoteDraft {
  selectedText: string;
  comment: string;
  aiResponse: string;
  color: string;
}

interface UseNoteSessionOptions {
  selectedText: string;
  documentFileName: string;
  // Read once on mount: the dialog remounts this session every time it opens.
  annotation: Annotation | null;
  onSave: (draft: NoteDraft) => Promise<Annotation>;
  onColorChange: (color: string) => Promise<void>;
}

export type NoteErrorKey = keyof typeof referenceMessages.notes.errors;

// What failed (generation, save, color) plus the API reason, shown when it is specific.
export interface NoteSessionError {
  key: NoteErrorKey;
  reason: ApiErrorKey;
}

const toNoteError = (key: NoteErrorKey, error: unknown): NoteSessionError => ({ key, reason: getApiErrorKey(error) });

export const useNoteSession = ({
  selectedText,
  documentFileName,
  annotation,
  onSave,
  onColorChange,
}: UseNoteSessionOptions) => {
  const t = useTranslations("notes.prompts");
  const [phase, setPhase] = useState<NotePhase>(annotation ? "viewing" : "compose");
  const [instruction, setInstruction] = useState(annotation?.comment ?? "");
  const [note, setNote] = useState(annotation?.aiResponse ?? "");
  const [proposal, setProposal] = useState<string | null>(null);
  const [color, setColor] = useState(annotation?.color ?? DEFAULT_NOTE_COLOR);
  // Saves started before a color change (e.g. while generating) must still use the latest one.
  const colorRef = useRef(color);
  const [error, setError] = useState<NoteSessionError | null>(null);

  const { completion, complete, stop: stopStream } = useStreamingNote();
  const stoppedByUser = useRef(false);

  // Closing the dialog unmounts the session; don't leave a request streaming into nothing.
  const stopOnUnmount = useRef(stopStream);
  useEffect(() => {
    stopOnUnmount.current = stopStream;
  }, [stopStream]);
  useEffect(() => () => stopOnUnmount.current(), []);

  const locale = useLocale();
  const requestNote = useCallback(
    async (prompt: string, originalNote?: string): Promise<string | null> => {
      stoppedByUser.current = false;
      setError(null);
      try {
        const result = await complete(prompt, {
          selectedText,
          prompt,
          documentContext: `Document: ${documentFileName}`,
          originalNote,
          // Notes speak the reader's language, keeping the document's terms in brackets.
          responseLanguage: locale,
        });
        if (!result && !stoppedByUser.current) setError({ key: "generation", reason: "unknown" });
        return result || null;
      } catch (requestError) {
        setError(toNoteError("generation", requestError));
        return null;
      }
    },
    [complete, selectedText, documentFileName, locale]
  );

  const persist = useCallback(
    async (aiResponse: string, comment: string) => {
      try {
        await onSave({ selectedText, comment, aiResponse, color: colorRef.current });
      } catch (saveError) {
        setError(toNoteError("save", saveError));
      }
    },
    [onSave, selectedText]
  );

  const generate = useCallback(
    async (prompt: string) => {
      setInstruction(prompt);
      setPhase("generating");
      const result = await requestNote(prompt);
      if (!result) {
        setPhase("compose");
        return;
      }
      setNote(result);
      setPhase("viewing");
      await persist(result, prompt);
    },
    [requestNote, persist]
  );

  // Without a change request this asks for a fresh take on the same instruction.
  const revise = useCallback(
    async (change?: string) => {
      setPhase("revising");
      const prompt = change ? t("revise", { instruction, change }) : instruction;
      const result = await requestNote(prompt, note);
      if (!result || result.trim() === note.trim()) {
        setPhase("viewing");
        return;
      }
      setProposal(result);
      setPhase("reviewing");
    },
    [instruction, note, requestNote, t]
  );

  const resolveReview = useCallback(
    async (merged: string) => {
      setProposal(null);
      setPhase("viewing");
      if (merged === note) return;
      setNote(merged);
      await persist(merged, instruction);
    },
    [note, instruction, persist]
  );

  const stop = useCallback(() => {
    stoppedByUser.current = true;
    stopStream();
  }, [stopStream]);

  const changeColor = useCallback(
    (nextColor: string) => {
      setColor(nextColor);
      colorRef.current = nextColor;
      // A note that isn't saved yet takes the color with it on its first save.
      if (phase !== "compose" && phase !== "generating") {
        onColorChange(nextColor).catch((colorError) => setError(toNoteError("color", colorError)));
      }
    },
    [phase, onColorChange]
  );

  return {
    phase,
    instruction,
    note,
    proposal,
    streamingText: completion,
    color,
    error,
    isBusy: phase === "generating" || phase === "revising",
    generate,
    revise,
    resolveReview,
    stop,
    changeColor,
  };
};

export type NoteSession = ReturnType<typeof useNoteSession>;
