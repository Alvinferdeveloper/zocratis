import axios from "axios";
import type referenceMessages from "@/messages/es";

export type ApiErrorKey = keyof typeof referenceMessages.errors;

// API error codes (estudia-api `ErrorCode`) mapped to message keys; codes not listed fall back to "unknown".
const ERROR_CODE_KEYS: Record<string, ApiErrorKey> = {
  UNAUTHENTICATED: "unauthenticated",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  TOO_MANY_REQUESTS: "tooManyRequests",
  DOCUMENT_NOT_FOUND: "documentNotFound",
  DOCUMENT_ACCESS_DENIED: "documentAccessDenied",
  NO_FILE_UPLOADED: "noFileUploaded",
  ONLY_PDF_ALLOWED: "onlyPdfAllowed",
  DOCUMENT_UPLOAD_FAILED: "documentUploadFailed",
  DOCUMENT_DELETE_FAILED: "documentDeleteFailed",
  DOCUMENT_FILE_UNAVAILABLE: "documentFileUnavailable",
  DOCUMENT_NO_READABLE_TEXT: "documentNoReadableText",
  VECTORIZATION_FAILED: "vectorizationFailed",
  FOLDER_NOT_FOUND: "folderNotFound",
  TOPIC_NOT_FOUND: "topicNotFound",
  CONVERSATION_NOT_FOUND: "conversationNotFound",
  EXAM_NOT_FOUND: "examNotFound",
  FLASHCARD_NOT_FOUND: "flashcardNotFound",
  ANNOTATION_NOT_FOUND: "noteNotFound",
  EXAM_ATTEMPT_FINISHED: "examAttemptFinished",
  EXAM_TIME_UP: "examTimeUp",
  AI_PROVIDER_ERROR: "aiUnavailable",
  TRANSLATION_FAILED: "translationFailed",
  INSUFFICIENT_CREDITS: "insufficientCredits",
  QUOTA_EXCEEDED: "quotaExceeded",
  CAP_EXCEEDED: "capExceeded",
  EVALUATION_LIMIT_REACHED: "evaluationLimitReached",
  FEATURE_NOT_AVAILABLE: "featureNotAvailable",
  SUBSCRIPTION_INACTIVE: "subscriptionInactive",
  NO_ACTIVE_SUBSCRIPTION: "noActiveSubscription",
  INVALID_PLAN: "invalidPlan",
  PAYMENT_NOT_FOUND: "paymentNotFound",
  PAYMENT_APPROVAL_PENDING: "paymentApprovalPending",
  PAYMENT_EXPIRED: "paymentExpired",
  PAYMENT_CAPTURE_FAILED: "paymentCaptureFailed",
  PAYMENT_CREATION_FAILED: "paymentCreationFailed",
  SUBSCRIPTION_ACTIVATION_FAILED: "subscriptionActivationFailed",
};

// Limits an upgrade lifts, so their messages come with a link to the plans.
const PLAN_LIMIT_ERRORS: ApiErrorKey[] = ["insufficientCredits", "quotaExceeded", "capExceeded", "featureNotAvailable"];

export const isPlanLimitError = (key: ApiErrorKey): boolean => PLAN_LIMIT_ERRORS.includes(key);

export const getApiErrorKeyFromBody = (body: unknown): ApiErrorKey => {
  const code = body && typeof body === "object" ? (body as { code?: unknown }).code : undefined;
  return (typeof code === "string" && ERROR_CODE_KEYS[code]) || "unknown";
};

// AI SDK streams put the API's JSON body (or the chat's bare code) in `error.message`.
const parseStreamError = (message: string): unknown => {
  try {
    return JSON.parse(message);
  } catch {
    return { code: message };
  }
};

export const getApiErrorKey = (error: unknown): ApiErrorKey => {
  if (axios.isAxiosError(error)) {
    return error.response ? getApiErrorKeyFromBody(error.response.data) : "network";
  }
  // fetch rejects with a TypeError when the server can't be reached.
  if (error instanceof TypeError) return "network";
  if (error instanceof Error) return getApiErrorKeyFromBody(parseStreamError(error.message));
  return "unknown";
};
