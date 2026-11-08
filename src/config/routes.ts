const DOCUMENT_BASE = "/document";
const REVIEW_BASE = "/review";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  workspace: "/workspace",
  workspaceCollection: (topicId: string, folderId?: string) =>
    `/workspace?topic=${topicId}${folderId ? `&folder=${folderId}` : ""}`,
  subscription: "/subscription",
  adminMetrics: "/admin/metrics",
  // Without a document, the review covers all of them.
  review: (documentId?: string) => (documentId ? `${REVIEW_BASE}?document=${documentId}` : REVIEW_BASE),
  document: (id: string) => `${DOCUMENT_BASE}/${id}`,
  documentPage: (id: string, page: number) => `${DOCUMENT_BASE}/${id}?page=${page}`,
  documentExams: (id: string) => `${DOCUMENT_BASE}/${id}/exams`,
  documentFlashcards: (id: string) => `${DOCUMENT_BASE}/${id}/flashcards`,
  examAttempt: (documentId: string, examId: string, attemptId: string) =>
    `${DOCUMENT_BASE}/${documentId}/exams/${examId}/attempts/${attemptId}`,
} as const;

// Route groups the middleware guards.
export const PROTECTED_ROUTE_PREFIXES = [ROUTES.workspace, DOCUMENT_BASE, REVIEW_BASE, "/admin"];
export const AUTH_ROUTES: string[] = [ROUTES.login, ROUTES.register];
