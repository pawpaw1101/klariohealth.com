/**
 * AUTH-REFRESH security matrix for the web session lifecycle.
 *
 * These exercise the real `apiFetch` against a stubbed `fetch`, so they assert the client's
 * actual 401/refresh/retry behaviour rather than a reimplementation of it. No real credentials
 * are used anywhere: token values here are opaque placeholder strings.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiFetch,
  clearKlarioSession,
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
  __hasRefreshInFlight
} from "@/lib/api/client";

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const unauthorized = () =>
  json(401, { detail: { code: "unauthenticated", message: "Your session expired. Please sign in again." } });

let calls: Array<{ url: string; init: RequestInit }> = [];
let handler: Handler;

function installFetch(next: Handler) {
  handler = next;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  }));
}

const refreshCalls = () => calls.filter((call) => call.url.includes("/auth/refresh"));
const protectedCalls = () => calls.filter((call) => !call.url.includes("/auth/refresh"));

beforeEach(() => {
  calls = [];
  clearKlarioSession();
  setAuthTokens("access-old", "refresh-old");
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearKlarioSession();
});

describe("AUTH-REFRESH-01 valid refresh after access expiration", () => {
  it("refreshes once, retries once, and returns the original response", async () => {
    let protectedHits = 0;
    installFetch((url) => {
      if (url.includes("/auth/refresh")) return json(200, { access_token: "access-new", refresh_token: null });
      protectedHits += 1;
      return protectedHits === 1 ? unauthorized() : json(200, { ok: true });
    });

    await expect(apiFetch("/dashboard")).resolves.toEqual({ ok: true });
    expect(refreshCalls()).toHaveLength(1);
    expect(protectedCalls()).toHaveLength(2);
    expect(getAuthToken()).toBe("access-new");
    // The rotated credential arrives as an HttpOnly cookie, so nothing long-lived is left
    // anywhere script can read it.
    expect(getRefreshToken()).toBeNull();
    expect(window.sessionStorage.getItem("klario.refresh_token")).toBeNull();
    // The refresh is sent with credentials and the transport header that opts into cookies.
    const refreshInit = refreshCalls()[0].init;
    expect(refreshInit.credentials).toBe("include");
    expect(new Headers(refreshInit.headers).get("X-Klario-Refresh-Transport")).toBe("cookie");
    // The retry must carry the new credential, not the expired one.
    expect(new Headers(protectedCalls()[1].init.headers).get("Authorization")).toBe("Bearer access-new");
  });
});

describe("AUTH-REFRESH-02 expired refresh credential", () => {
  it("clears the session and reports a safe message", async () => {
    installFetch((url) => (url.includes("/auth/refresh") ? unauthorized() : unauthorized()));
    const expired = vi.fn();
    window.addEventListener("klario:session-expired", expired);

    await expect(apiFetch("/dashboard")).rejects.toMatchObject({ status: 401 });
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    window.removeEventListener("klario:session-expired", expired);
  });
});

describe("AUTH-REFRESH-03 revoked refresh/session", () => {
  it("does not restore access when the backend rejects the credential", async () => {
    installFetch((url) =>
      url.includes("/auth/refresh")
        ? json(401, { detail: { code: "session_expired", message: "Your session expired. Please sign in again." } })
        : unauthorized()
    );

    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(1);
    expect(getAuthToken()).toBeNull();
  });
});

describe("AUTH-REFRESH-04 rotated refresh credential is never reused", () => {
  it("never re-presents a credential from JS storage across repeated rotations", async () => {
    const presented: Array<string | undefined> = [];
    let issued = 0;
    let failNext = true;
    installFetch((url, init) => {
      if (url.includes("/auth/refresh")) {
        presented.push(JSON.parse(String(init.body)).refresh_token);
        issued += 1;
        return json(200, { access_token: `access-${issued}`, refresh_token: null });
      }
      if (failNext) {
        failNext = false;
        return unauthorized();
      }
      return json(200, { ok: true });
    });

    for (let round = 0; round < 3; round += 1) {
      failNext = true;
      await expect(apiFetch("/dashboard")).resolves.toEqual({ ok: true });
    }

    // The first attempt migrates a legacy sessionStorage credential; every later refresh
    // sends nothing at all and lets the rotating cookie speak for itself. A rotated value is
    // therefore never replayed from script-readable storage.
    expect(presented[0]).toBe("refresh-old");
    expect(presented.slice(1)).toEqual([undefined, undefined]);
    expect(getRefreshToken()).toBeNull();
  });
});

describe("AUTH-REFRESH-05 multiple simultaneous 401s trigger one refresh", () => {
  it("shares a single refresh across four concurrent requests", async () => {
    const seen = new Set<string>();
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    installFetch(async (url, init) => {
      if (url.includes("/auth/refresh")) {
        await refreshGate;
        return json(200, { access_token: "access-new", refresh_token: null });
      }
      const auth = new Headers(init.headers).get("Authorization");
      if (auth === "Bearer access-old") {
        seen.add(url);
        return unauthorized();
      }
      return json(200, { ok: true });
    });

    const pending = Promise.all([
      apiFetch("/dashboard"),
      apiFetch("/reports"),
      apiFetch("/family"),
      apiFetch("/notifications")
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseRefresh();

    await expect(pending).resolves.toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
    expect(seen.size).toBe(4);
    expect(refreshCalls()).toHaveLength(1);
    expect(__hasRefreshInFlight()).toBe(false);
  });
});

describe("AUTH-REFRESH-06 refresh failure cannot loop", () => {
  it("makes at most one refresh and one retry when the retry also fails", async () => {
    installFetch((url) =>
      url.includes("/auth/refresh") ? json(200, { access_token: "access-new", refresh_token: null }) : unauthorized()
    );

    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(1);
    expect(protectedCalls()).toHaveLength(2);
    expect(getAuthToken()).toBeNull();
  });

  it("never issues a refresh for the refresh endpoint itself", async () => {
    installFetch(() => unauthorized());
    await expect(apiFetch("/auth/refresh", { method: "POST", auth: false })).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(1);
  });
});

describe("AUTH-REFRESH-12 network failure during refresh", () => {
  it("keeps the session when the refresh transport fails", async () => {
    installFetch((url) => {
      if (url.includes("/auth/refresh")) throw new TypeError("Failed to fetch");
      return unauthorized();
    });

    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);
    expect(getRefreshToken()).toBe("refresh-old");
    expect(getAuthToken()).toBe("access-old");
  });

  it("keeps the session when refresh returns 5xx", async () => {
    installFetch((url) => (url.includes("/auth/refresh") ? json(503, {}) : unauthorized()));

    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);
    expect(getRefreshToken()).toBe("refresh-old");
  });

  it("does not retry the refresh endlessly", async () => {
    installFetch((url) => {
      if (url.includes("/auth/refresh")) throw new TypeError("Failed to fetch");
      return unauthorized();
    });

    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(1);
  });
});

describe("AUTH-REFRESH-13 mutation during expiration is not duplicated", () => {
  it("does not execute a mutation twice when the first attempt is rejected by auth", async () => {
    let executed = 0;
    installFetch((url, init) => {
      if (url.includes("/auth/refresh")) return json(200, { access_token: "access-new", refresh_token: null });
      const auth = new Headers(init.headers).get("Authorization");
      // A 401 is returned by auth middleware before the handler runs, so a rejected attempt
      // is never counted as an execution.
      if (auth === "Bearer access-old") return unauthorized();
      executed += 1;
      return json(200, { id: "doc-1" });
    });

    await expect(apiFetch("/documents", { method: "POST", body: { title: "x" } })).resolves.toEqual({ id: "doc-1" });
    expect(executed).toBe(1);
    expect(protectedCalls()).toHaveLength(2);
  });
});

describe("AUTH-REFRESH-14 document upload during expiration", () => {
  it("replays a multipart body once and creates a single document", async () => {
    let created = 0;
    installFetch((url, init) => {
      if (url.includes("/auth/refresh")) return json(200, { access_token: "access-new", refresh_token: null });
      const auth = new Headers(init.headers).get("Authorization");
      if (auth === "Bearer access-old") return unauthorized();
      expect(init.body).toBeInstanceOf(FormData);
      created += 1;
      return json(200, { document_id: "doc-1" });
    });

    const form = new FormData();
    form.append("file", new Blob(["synthetic"], { type: "application/pdf" }), "synthetic.pdf");

    await expect(apiFetch("/documents/upload", { method: "POST", body: form })).resolves.toEqual({ document_id: "doc-1" });
    expect(created).toBe(1);
  });

  it("does not replay a stream body it cannot re-read", async () => {
    installFetch((url) => (url.includes("/auth/refresh") ? json(200, { access_token: "a", refresh_token: null }) : unauthorized()));
    const stream = new ReadableStream({ start: (controller) => controller.close() });

    await expect(
      apiFetch("/documents/upload", { method: "POST", body: stream as unknown as BodyInit, headers: { "Content-Type": "application/octet-stream" } })
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(0);
    expect(protectedCalls()).toHaveLength(1);
  });
});

describe("AUTH-REFRESH-10/11 session restoration on reload", () => {
  it("restores by refreshing when the stored access token has expired", async () => {
    let meHits = 0;
    installFetch((url) => {
      if (url.includes("/auth/refresh")) return json(200, { access_token: "access-new", refresh_token: null });
      meHits += 1;
      return meHits === 1 ? unauthorized() : json(200, { id: "user-1" });
    });

    await expect(apiFetch("/auth/me")).resolves.toEqual({ id: "user-1" });
    expect(getAuthToken()).toBe("access-new");
  });

  it("does not restore a revoked session", async () => {
    installFetch(() => unauthorized());
    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(getAuthToken()).toBeNull();
  });

  it("makes exactly one cookie-backed refresh attempt when no JS credential is stored", async () => {
    clearKlarioSession();
    installFetch(() => unauthorized());
    // The cookie is invisible to script, so the client cannot pre-judge whether a session
    // exists. It attempts once and tears down on failure - never more than once.
    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls()).toHaveLength(1);
    expect(getAuthToken()).toBeNull();
  });
});

describe("AUTH-REFRESH-07 logout clears local credentials", () => {
  it("leaves no access or refresh credential readable afterwards", () => {
    expect(getRefreshToken()).toBe("refresh-old");
    clearKlarioSession();
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(window.sessionStorage.getItem("klario.access_token")).toBeNull();
    expect(window.sessionStorage.getItem("klario.refresh_token")).toBeNull();
  });
});

describe("credential hygiene", () => {
  it("never places credentials in a URL or query string", async () => {
    installFetch((url) => (url.includes("/auth/refresh") ? json(200, { access_token: "access-new", refresh_token: null }) : unauthorized()));
    await expect(apiFetch("/dashboard")).rejects.toBeInstanceOf(ApiError);

    for (const call of calls) {
      expect(call.url).not.toContain("refresh-old");
      expect(call.url).not.toContain("access-old");
      expect(call.url).not.toContain("token=");
    }
  });
});
