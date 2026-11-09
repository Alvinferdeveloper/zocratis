import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/product-events";
import {
  type FeynmanSource,
  type FeynmanSubject,
  useFeynmanAttempts,
  useSubmitFeynman,
} from "@/app/[locale]/document/[id]/hooks/useFeynman";
import {
  type FeynmanSourceProblem,
  type FeynmanSubjectHistory,
  loadFeynmanSource,
} from "@/app/[locale]/document/[id]/lib/feynman";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";

type FeynmanView = "closed" | "home" | "writing" | "result";

interface UseFeynmanSessionOptions {
  documentId: string;
  pdfDoc: PdfDocument | null;
  onGoToPage: (page: number) => void;
}

// One run of "teach it back": what is being explained, the draft, and whether the document is covered.
export const useFeynmanSession = ({ documentId, pdfDoc, onGoToPage }: UseFeynmanSessionOptions) => {
  const [view, setView] = useState<FeynmanView>("closed");
  const [subject, setSubject] = useState<FeynmanSubject | null>(null);
  const [source, setSource] = useState<FeynmanSource | null>(null);
  const [draft, setDraft] = useState("");
  const [isPeeking, setIsPeeking] = useState(false);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [sourceProblem, setSourceProblem] = useState<FeynmanSourceProblem | null>(null);

  const { data: allAttempts = [] } = useFeynmanAttempts(documentId, view !== "closed");
  const submission = useSubmitFeynman(documentId);
  const attempts = useMemo(
    () => (subject ? allAttempts.filter((attempt) => attempt.subject.id === subject.id) : []),
    [allAttempts, subject]
  );

  const prepareAttempt = async (next: FeynmanSubject): Promise<boolean> => {
    setSourceProblem(null);
    setIsPreparing(true);
    const loaded = await loadFeynmanSource(pdfDoc, next);
    setIsPreparing(false);
    if (typeof loaded === "string") {
      setSourceProblem(loaded);
      setView("home");
      return false;
    }
    submission.reset();
    setSubject(next);
    setSource(loaded);
    setDraft("");
    setIsPeeking(false);
    setHasPeeked(false);
    setView("writing");
    return true;
  };

  const teach = async (next: FeynmanSubject) => {
    setView((current) => (current === "closed" ? "home" : current));
    if (await prepareAttempt(next)) trackEvent("feynman_started", { kind: next.kind });
  };

  const retry = () => {
    if (subject) prepareAttempt(subject);
  };

  const openHistory = ({ subject: next }: FeynmanSubjectHistory) => {
    setSubject(next);
    setView("result");
    onGoToPage(next.pageNumber);
  };

  const togglePeek = () => {
    setIsPeeking((current) => !current);
    setHasPeeked(true);
  };

  const submit = () => {
    if (!subject || !source) return;
    submission.mutate(
      { subject, source, explanation: draft.trim(), peeked: hasPeeked },
      {
        onSuccess: () => {
          setIsPeeking(false);
          setView("result");
        },
      }
    );
  };

  return {
    view,
    isOpen: view !== "closed",
    isWriting: view === "writing",
    isBookClosed: view === "writing" && !isPeeking,
    isPeeking,
    subject,
    attempts,
    allAttempts,
    draft,
    setDraft,
    hasDraft: view === "writing" && draft.trim().length > 0,
    isPreparing,
    sourceProblem,
    isSubmitting: submission.isPending,
    submitError: submission.error,
    openHome: () => {
      setSourceProblem(null);
      setView("home");
    },
    close: () => setView("closed"),
    teach,
    retry,
    openHistory,
    togglePeek,
    submit,
  };
};

export type FeynmanSession = ReturnType<typeof useFeynmanSession>;
