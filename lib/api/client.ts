import type { APIErrorResponse } from "@/lib/api/types";

const TOKEN_KEY = "klario.access_token";
const REFRESH_TOKEN_KEY = "klario.refresh_token";
const ACTIVE_FAMILY_KEY = "klario.active_family_id";
const ACTIVE_MEMBER_KEY = "klario.active_member_id";

let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

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
  return process.env.NEXT_PUBLIC_KLARIO_API_BASE_URL ?? "https://klario-backend.onrender.com/api/v1";
}

export function getApiRootUrl() {
  if (process.env.NEXT_PUBLIC_KLARIO_API_ROOT) return process.env.NEXT_PUBLIC_KLARIO_API_ROOT;

  try {
    const base = new URL(getApiBaseUrl());
    return `${base.protocol}//${base.host}`;
  } catch {
    return "https://klario-backend.onrender.com";
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

export function getRefreshToken() {
  if (memoryRefreshToken) return memoryRefreshToken;
  if (typeof window === "undefined") return null;
  memoryRefreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
  return memoryRefreshToken;
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null) {
  memoryToken = accessToken;
  memoryRefreshToken = refreshToken ?? memoryRefreshToken;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Removes a refresh credential left in sessionStorage by a session that predates cookie
 * transport. Nothing writes one any more; this only cleans up the migration case.
 */
export function clearLegacyRefreshToken() {
  memoryRefreshToken = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setAuthToken(token: string) {
  memoryToken = token;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearKlarioSession({ clearSelections = true }: { clearSelections?: boolean } = {}) {
  memoryToken = null;
  memoryRefreshToken = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
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

/**
 * A refresh attempt that could not reach a verdict — a transport failure or a 5xx. The
 * credential's validity is unknown, so the session is deliberately left intact rather than
 * signing the user out on what may be a dropped connection.
 */
class RefreshUnavailableError extends Error {}

/**
 * Opts this client into HttpOnly cookie transport for the refresh credential. A cross-site
 * page cannot set a custom header without a CORS preflight the API refuses, so requiring it
 * is what protects the cookie-authenticated endpoints from CSRF.
 */
export const REFRESH_TRANSPORT_HEADER = { "X-Klario-Refresh-Transport": "cookie" } as const;

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchanges the stored refresh credential for a new pair. Deliberately uses `fetch` directly
 * rather than `apiFetch`, so a 401 from this endpoint can never recurse into another refresh.
 */
async function performRefresh(): Promise<boolean> {
  // The credential lives in an HttpOnly cookie the browser attaches itself; there is
  // deliberately nothing to read here. A legacy credential in sessionStorage is still
  // accepted once, so a session opened before this change migrates instead of being
  // signed out.
  const legacyToken = getRefreshToken();

  let response: Response;
  try {
    response = await fetch(resolveApiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...REFRESH_TRANSPORT_HEADER },
      body: JSON.stringify(legacyToken ? { refresh_token: legacyToken, device_type: "web" } : { device_type: "web" })
    });
  } catch {
    throw new RefreshUnavailableError();
  }

  // 5xx says nothing about the credential; only the server's own 4xx verdict does.
  if (response.status >= 500) throw new RefreshUnavailableError();
  if (!response.ok) return false;

  const text = await response.text();
  const payload = text ? (safeJsonParse(text) as { access_token?: string; refresh_token?: string } | null) : null;
  if (!payload?.access_token) return false;

  // The rotated replacement is delivered as a cookie, so `refresh_token` is null here and
  // nothing long-lived is written to storage. Clearing any legacy value completes the
  // migration for sessions that began before cookie transport existed.
  setAuthTokens(payload.access_token, null);
  clearLegacyRefreshToken();
  return true;
}

/**
 * Single-flight: concurrent 401s share one refresh round-trip. Without this, four parallel
 * requests would send four refreshes, three of which would present an already-rotated token
 * and trip the backend's replay defence — logging the user out of every device.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Test seam: lets a suite assert that no refresh is left pending between cases. */
export function __hasRefreshInFlight() {
  return refreshInFlight !== null;
}

function endSession() {
  clearKlarioSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("klario:session-expired"));
  }
}

/**
 * A request may be replayed after a refresh only if its body can be read a second time. A
 * stream body is consumed by the first attempt, so replaying it would send an empty payload.
 */
function isReplayable(body: BodyInit | null | undefined) {
  return !(body instanceof ReadableStream);
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return executeRequest<T>(path, options, true);
}

async function executeRequest<T>(path: string, options: ApiRequestOptions, allowRefresh: boolean): Promise<T> {
  const { auth = true, body, token, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  let requestBody = body as BodyInit | null | undefined;
  // Anything the platform can send as-is is passed straight through; only plain objects are
  // serialised. Without the stream/params cases here a stream body was silently turned into
  // the string "{}" and the real payload was dropped.
  const isNativeBody = body instanceof FormData
    || body instanceof Blob
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body as ArrayBufferView)
    || body instanceof URLSearchParams
    || (typeof ReadableStream !== "undefined" && body instanceof ReadableStream);
  if (body && typeof body === "object" && !isNativeBody) {
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
    const message = errorPayload?.detail?.message ?? safeApiMessage(code);
    const apiError = new ApiError(response.status, code, message, errorPayload?.detail?.errors);

    // A 401 means auth middleware rejected the request before the handler ran, so the call had
    // no side effect and replaying it after a refresh cannot duplicate anything — this is what
    // makes retrying a non-idempotent mutation safe here.
    if (response.status === 401 && auth) {
      if (allowRefresh && isReplayable(requestBody)) {
        let refreshed: boolean;
        try {
          refreshed = await refreshSession();
        } catch (refreshError) {
          if (refreshError instanceof RefreshUnavailableError) {
            // Validity unknown: surface the original failure, keep the session.
            throw apiError;
          }
          throw refreshError;
        }
        if (refreshed) {
          // Exactly one retry, with refresh disabled so a second 401 ends the session
          // instead of looping. Any caller-supplied token is dropped so the retry carries
          // the newly issued one.
          return executeRequest<T>(path, { ...options, token: undefined }, false);
        }
      }
      endSession();
      throw apiError;
    }

    if (auth && response.status === 403 && ["unauthenticated", "inactive_user", "session_expired", "access_revoked"].includes(code)) {
      endSession();
    }
    throw apiError;
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
    unauthenticated: "Your session expired. Please sign in again.",
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
