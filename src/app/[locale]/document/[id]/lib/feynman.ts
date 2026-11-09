import type {
  FeynmanAttempt,
  FeynmanFeedback,
  FeynmanSource,
  FeynmanSubject,
} from "@/app/[locale]/document/[id]/hooks/useFeynman";
import type { PdfDocument } from "@/app/[locale]/document/[id]/lib/pdf-document";
import { extractPagesText } from "@/app/[locale]/document/[id]/lib/pdf-text";
import { captureRegion } from "@/app/[locale]/document/[id]/lib/region-image";

// Mirrored in estudia-api `ai/dto/feynman.dto.ts`.
export const FEYNMAN_MIN_EXPLANATION = 20;
export const FEYNMAN_MAX_EXPLANATION = 6000;
const MAX_SOURCE_CHARS = 40_000;
const MAX_SUBJECT_TEXT_IN_ID = 2000;

export const FEYNMAN_MAX_PAGES = 8;
const MIN_READABLE_CHARS = 20;

export const passageSubject = (text: string, pageNumber: number): FeynmanSubject => ({
  id: `${pageNumber}:${text.slice(0, MAX_SUBJECT_TEXT_IN_ID)}`,
  kind: "passage",
  pageNumber,
  pageTo: null,
  text,
  region: null,
  regionKind: null,
});

export const pagesSubject = (from: number, to: number): FeynmanSubject => ({
  id: `pages:${from}-${to}`,
  kind: "pages",
  pageNumber: from,
  pageTo: to,
  text: null,
  region: null,
  regionKind: null,
});

export type FeynmanSourceProblem = "unreadable" | "tooLong";

// Every attempt reads its source again, so one reopened from the history works like a new one.
export const loadFeynmanSource = async (
  pdf: PdfDocument | null,
  subject: FeynmanSubject
): Promise<FeynmanSource | FeynmanSourceProblem> => {
  if (subject.kind === "passage") return { text: subject.text ?? "" };
  if (!pdf) return "unreadable";
  try {
    if (subject.kind === "region") {
      return subject.region ? await captureRegion(pdf, subject.region) : "unreadable";
    }
    const pages = Array.from(
      { length: (subject.pageTo ?? subject.pageNumber) - subject.pageNumber + 1 },
      (_, index) => subject.pageNumber + index
    );
    const text = await extractPagesText(pdf, pages);
    if (text.replace(/--- Page \d+ ---/g, "").trim().length < MIN_READABLE_CHARS) return "unreadable";
    return text.length > MAX_SOURCE_CHARS ? "tooLong" : { text };
  } catch (error) {
    console.error("Failed to read the subject from the PDF", error);
    return "unreadable";
  }
};

export const masteredCount = (feedback: FeynmanFeedback): number =>
  feedback.ideas.filter((idea) => idea.status === "mastered").length;

export interface FeynmanSubjectHistory {
  subject: FeynmanSubject;
  attempts: FeynmanAttempt[];
}

// Most recently practised first; each subject's attempts stay oldest first.
export const groupAttemptsBySubject = (attempts: FeynmanAttempt[]): FeynmanSubjectHistory[] => {
  const histories = new Map<string, FeynmanSubjectHistory>();
  for (const attempt of attempts) {
    const history = histories.get(attempt.subject.id) ?? { subject: attempt.subject, attempts: [] };
    histories.delete(attempt.subject.id);
    histories.set(attempt.subject.id, { ...history, attempts: [...history.attempts, attempt] });
  }
  return [...histories.values()].reverse();
};

export type FeynmanMark = "term" | "quote";

export interface MarkedSegment {
  text: string;
  mark: FeynmanMark | null;
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Splits the student's text around the phrases to mark, matched like the API validated them.
export const markPhrases = (text: string, phrases: { phrase: string; mark: FeynmanMark }[]): MarkedSegment[] => {
  if (phrases.length === 0) return [{ text, mark: null }];
  const ordered = [...phrases].sort((a, b) => b.phrase.length - a.phrase.length);
  const pattern = ordered.map(({ phrase }) => `(${escapeRegExp(phrase).replace(/\s+/g, "\\s+")})`).join("|");

  const segments: MarkedSegment[] = [];
  let position = 0;
  for (const match of text.matchAll(new RegExp(pattern, "giu"))) {
    if (match.index > position) segments.push({ text: text.slice(position, match.index), mark: null });
    const group = match.slice(1).findIndex(Boolean);
    segments.push({ text: match[0], mark: ordered[group].mark });
    position = match.index + match[0].length;
  }
  if (position < text.length) segments.push({ text: text.slice(position), mark: null });
  return segments;
};
