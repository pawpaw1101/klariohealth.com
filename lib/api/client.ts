import type { APIErrorResponse } from "@/lib/api/types";

const TOKEN_KEY = "klario.access_token";
const ACTIVE_FAMILY_KEY = "klario.active_family_id";
const ACTIVE_MEMBER_KEY = "klario.active_member_id";

let memoryToken: string | null = null;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: BodyInit | object | null;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown[];

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_KLARIO_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
}

export function getApiRootUrl() {
  if (process.env.NEXT_PUBLIC_KLARIO_API_ROOT) return process.env.NEXT_PUBLIC_KLARIO_API_ROOT;

  try {
    const base = new URL(getApiBaseUrl());
    return `${base.protocol}//${base.host}`;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

export function getEnvironmentLabel() {
  const apiBase = getApiBaseUrl();
  if (apiBase.includes("127.0.0.1") || apiBase.includes("localhost")) return "local";
  if (apiBase.includes("staging")) return "staging";
  return "production";
}

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  memoryToken = window.sessionStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export function setAuthToken(token: string) {
  memoryToken = token;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearKlarioSession({ clearSelections = true }: { clearSelections?: boolean } = {}) {
  memoryToken = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  if (clearSelections) {
    window.localStorage.removeItem(ACTIVE_FAMILY_KEY);
    window.localStorage.removeItem(ACTIVE_MEMBER_KEY);
  }
}

export function getStoredActiveFamilyId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_FAMILY_KEY);
}

export function setStoredActiveFamilyId(familyId: string | null) {
  if (typeof window === "undefined") return;
  if (familyId) {
    window.localStorage.setItem(ACTIVE_FAMILY_KEY, familyId);
  } else {
    window.localStorage.removeItem(ACTIVE_FAMILY_KEY);
  }
}

export function getStoredActiveMemberId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_MEMBER_KEY);
}

export function setStoredActiveMemberId(memberId: string | null) {
  if (typeof window === "undefined") return;
  if (memberId) {
    window.localStorage.setItem(ACTIVE_MEMBER_KEY, memberId);
  } else {
    window.localStorage.removeItem(ACTIVE_MEMBER_KEY);
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, token, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  let requestBody = body as BodyInit | null | undefined;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    requestBody = JSON.stringify(body);
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
  }

  if (auth) {
    const authToken = token ?? getAuthToken();
    if (authToken) {
      requestHeaders.set("Authorization", `Bearer ${authToken}`);
    }
  }

  const response = await fetch(resolveApiUrl(path), {
    ...init,
    body: requestBody,
    headers: requestHeaders
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const errorPayload = payload as APIErrorResponse | null;
    const code = errorPayload?.detail?.code ?? "internal_error";
    if (response.status === 401) {
      clearKlarioSession();
    }
    throw new ApiError(response.status, code, safeApiMessage(code), errorPayload?.detail?.errors);
  }

  return payload as T;
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl().replace(/\/$/, "")}${normalizedPath}`;
}

export function resolveExternalOrRelativeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, getApiRootUrl()).toString();
}

export function safeApiMessage(code: string) {
  const messages: Record<string, string> = {
    unauthenticated: "Please sign in again.",
    inactive_user: "Your account is inactive.",
    permission_denied: "You don't have permission to do this.",
    not_found: "That item is no longer available.",
    validation_error: "Please check your information and try again.",
    duplicate_invite: "An invite is already pending for this email.",
    duplicate_active_parse_job: "Processing is already in progress.",
    unsupported_file_type: "This file type is not supported.",
    file_too_large: "File exceeds maximum size (25 MB).",
    invalid_family_member: "Selected family member is invalid.",
    invalid_document_state: "This report cannot be processed right now.",
    upload_verification_failed: "Upload could not be verified. Please try again.",
    checksum_mismatch: "Upload verification failed. Please try again.",
    storage_object_not_found: "Upload was not received. Please try again.",
    malware_scan_blocked: "This file could not be processed for security reasons.",
    invalid_invite: "This invite is no longer valid.",
    email_delivery_failed: "Invite email could not be sent. Try again later.",
    ocr_provider_not_configured: "Processing is temporarily unavailable.",
    internal_error: "Something went wrong. Please try again."
  };

  return messages[code] ?? messages.internal_error;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
