# Web session lifecycle

How the Klario web client authenticates, stays authenticated, and tears down. Contains no
credential values — only states (`PRESENT` / `MISSING` / `ROTATED` / `REVOKED` / `VALID` /
`INVALID`).

Updated 2026-08-21 for HttpOnly cookie transport and stable session identity.

Audited against the live implementations on 2026-08-21:
`Biolens-Backend/app/domains/auth`, `Biolens-Frontend/klariohealth.com/lib/api/client.ts`,
`Biolens-ios/Projects/Core/CoreBioLensAPI/Sources/BioLensAPIClient.swift`.

---

## 1. The backend contract

The backend is the authority. Web and iOS both conform to it; neither invents policy.

| Property | Implementation |
| --- | --- |
| Access token | Stateless JWT (HS256), claims `sub`, `email`, `token_version`, `session_id`, `iat`, `exp` |
| Access lifetime | `JWT_EXPIRES_MINUTES`, currently **60 minutes** |
| Refresh token | Opaque 32-byte random string; only its SHA-256 hash is stored |
| Refresh lifetime | `REFRESH_TOKEN_EXPIRES_DAYS`, default **30 days** |
| Rotation | **Yes** — every refresh marks the presented row `ROTATED` and issues a new row |
| Single use | **Yes** — a `ROTATED` row is never accepted again |
| Server-side sessions | **Yes** — one `refresh_tokens` row per live session |
| Revocable | **Yes** — per session, "others", or all |
| Multi-device | **Yes** — independent rows, independent lifetimes |

### Replay defence

Presenting an already-`ROTATED` credential is treated as theft, not as a mistake:
every active session for that account is revoked, a `REFRESH_TOKEN_REPLAY_DETECTED` audit
event is written, and an `abnormal_login` security alert is sent.

**This is why single-flight refresh is mandatory on the client.** Four concurrent refreshes
would present the same credential four times; three would be replays, and the account would be
signed out everywhere.

### Two independent liveness checks

Every authenticated request validates both:

1. `user.token_version == claims.token_version` — bumped by password change and password
   reset, which invalidates every previously minted access token instantly.
2. `session_id` resolves to a row that is still `ACTIVE` — which is what makes "revoke this
   session" take effect immediately rather than after the access token expires.

### Password events

| Event | Other sessions | Calling session | New credentials returned |
| --- | --- | --- | --- |
| Change password | Revoked | Revoked, then re-issued | **Yes** — caller must store them |
| Reset password | Revoked | Revoked | No — user signs in again |

---

## 2. Web credential storage

| Credential | Location | Readable by JS | Survives reload | Survives tab close |
| --- | --- | --- | --- | --- |
| Access token | `sessionStorage` + in-memory mirror | Yes | Yes | No |
| **Refresh credential** | **HttpOnly cookie** | **No** | Yes | Yes (until expiry) |
| Active family / member id | `localStorage` | Yes | Yes | Yes |

The long-lived credential is no longer reachable from script. An XSS on an authenticated origin
can at worst borrow the 60-minute access token; it cannot walk away with 30 days of access.

### Cookie attributes

| Attribute | Value | Reason |
| --- | --- | --- |
| Name | `klario_refresh` | — |
| `HttpOnly` | yes | Removes it from script's reach — the whole point |
| `Secure` | yes in production | Dropped outside production only because browsers reject Secure cookies over plain http |
| `SameSite` | `Lax` | Sufficient, because web and API are same-site (below). Lax also refuses to travel on cross-site POSTs |
| `Path` | `/api/v1/auth` | The cookie never accompanies a PHI request, so every data endpoint stays bearer-only |
| `Max-Age` | 30 days | Matches the credential's own lifetime |
| `Domain` | not set (host-only) | Host-only is narrower than a `.klariohealth.com` cookie a sibling subdomain could receive |

### Why SameSite=Lax is enough

    web  https://klariohealth.com, https://www.klariohealth.com
    api  https://api.klariohealth.com

All three share the registrable domain `klariohealth.com`, so a request from the web origin to
the API is **same-site** though cross-origin. Lax cookies travel on same-site requests, so
`SameSite=None` — which third-party cookie blocking increasingly refuses — is not needed.

### CSRF model

Two layers, because the cookie is ambient authority:

1. `SameSite=Lax` blocks the cookie on any cross-site POST.
2. Cookie-authenticated refresh additionally requires the header
   `X-Klario-Refresh-Transport: cookie`. A cross-origin page cannot set a custom header without
   a CORS preflight, which the API answers only for the configured origins. Without the header
   the cookie is ignored entirely — proven by `test_cookie_refresh_requires_the_transport_header`.

PHI endpoints are unaffected: they carry a bearer header the browser never attaches on its own.

### CORS

`allow_credentials=True` was already set; the web client now sends `credentials: "include"` on
the auth calls that use the cookie. Production origins remain an explicit allow-list — wildcards
and localhost are rejected by startup validation.

### Local development

`localhost` and `127.0.0.1` are *different sites*. Use the **same host** for both the app and
the API (both `127.0.0.1`, or both `localhost`), or the cookie will not be sent. `Secure` is
off outside production so the cookie works over http.

### Transport is per-client

iOS sends no transport header, keeps receiving the credential in the JSON body, and keeps
storing it in the Keychain — which is stronger than either browser option. Only clients that
opt in get cookie transport, so this change is backward-compatible.

---

## 3. Normal lifecycle

```
LOGIN (password -> OTP verify)
  │  access PRESENT, refresh PRESENT
  ▼
API CALLS  ── 200 ─────────────────────────────► continue
  │
  │ 401 (access expired; middleware rejected before the handler ran)
  ▼
REFRESH (single-flight, at most one in flight per tab)
  │
  ├── VALID ──► store rotated pair ──► retry original request ONCE ──► continue
  │                                     user stays on the current screen,
  │                                     query cache is untouched
  │
  ├── INVALID / REVOKED / EXPIRED ──► CLEAR SESSION
  │                                    ├─ wipe access + refresh
  │                                    ├─ queryClient.clear()  (all cached PHI)
  │                                    └─ "Your session expired. Please sign in again."
  │
  └── UNREACHABLE (transport error or 5xx) ──► KEEP SESSION
                                                surface the original error only;
                                                validity is unknown, so do not sign out
```

### Rules

- A 401 triggers **at most one** refresh and **at most one** retry. The retry runs with
  refresh disabled, so a second 401 ends the session rather than looping.
- The refresh call uses `fetch` directly, never `apiFetch`, so it can never recurse into
  another refresh.
- Retrying after a 401 cannot duplicate a mutation: a 401 is produced by auth middleware
  before the route handler executes, so the rejected attempt had no side effect. This is the
  same reasoning iOS relies on.
- A request whose body cannot be read twice (a `ReadableStream`) is never replayed.

---

## 4. Concurrency

Four simultaneous 401s produce **one** refresh:

```
GET /dashboard  ─┐
GET /reports    ─┤
GET /family     ─┼─► all 401 ─► ONE refresh ─► all four retry with the new access token
GET /notifications ┘
```

Implemented as a module-level promise in `lib/api/client.ts`; the second and subsequent
callers await the first promise rather than starting their own.

---

## 5. Teardown

| Trigger | Backend call | Local effect |
| --- | --- | --- |
| Sign out | `POST /auth/logout` (revokes the row) | Credentials wiped, `queryClient.clear()`, route to `/login` |
| Refresh returns INVALID | — | Same, plus session-expired message |
| Session revoked elsewhere | — (next request 401s) | Same |
| Password reset | Backend already revoked everything | Same |

Sign-out is never a bare redirect: the refresh row is revoked server-side first, so the
credential is dead even if a copy was captured.

## 6. Cross-account isolation

Two independent guarantees:

1. Every protected query key is namespaced by user id via `protectedQueryKey(userId, …)`.
2. `queryClient.clear()` runs on sign-out **and** on sign-in, before the new identity's first
   fetch.

So there is no frame in which user B can observe user A's cached data, even if a sign-out were
interrupted.

Auth-token refresh and data-cache revalidation are deliberately separate: a successful refresh
leaves the query cache untouched, and only a genuine authentication failure clears it.

## 7. Known limitations

- **Access token remains JS-readable** in `sessionStorage`. This is a deliberate trade: it is
  short-lived (60 minutes) and revocable server-side the instant its session is revoked, and
  holding it in memory only would sign the user out on every page reload. The long-lived
  credential — the one worth stealing — is no longer exposed.
- **No cross-tab synchronisation.** Because credentials live in `sessionStorage`, each tab
  holds an independent session and refreshes independently. Signing out in tab A does not sign
  out tab B until tab B's next request fails. No token is broadcast between tabs, which is the
  safe default; the cost is that tabs can briefly disagree.
- **No proactive refresh.** The client refreshes reactively, on 401, matching iOS. An action
  taken exactly at expiry is transparently retried rather than failing, so no client-side clock
  or skew allowance is needed; the backend remains the sole authority on expiry.
- ~~Session identifiers rotate.~~ **Fixed.** See §9.

## 8. iOS parity

| Behaviour | iOS | Web |
| --- | --- | --- |
| Storage | Keychain | `sessionStorage` |
| Refresh trigger | 401 on an auth-required request | Same |
| Single-flight | `RefreshCoordinator` actor | Shared module-level promise |
| Retries after refresh | Exactly one | Exactly one |
| Refresh recursion | Blocked (`requiresAuth: false`) | Blocked (raw `fetch`) |
| On refresh failure | Clear tokens, `onUnauthorized` | Clear tokens, `klario:session-expired` |
| Revoked session | Cannot recreate access | Cannot recreate access |

Storage differs by platform; session semantics agree.


## 9. Stable session identity

A **session** is now its own row (`auth_sessions`) that outlives every credential issued under
it. A **refresh credential** belongs to a session, rotates, is single-use, and is hashed at rest.

```
Session S  (stable id, created_at = original sign-in)
   ├── credential A  → rotated
   ├── credential B  → rotated
   └── credential C  → active
```

Refreshing replaces the credential and leaves S untouched. The access token's `session_id`
claim names S, so it too is stable across rotations.

| Property | Before | After |
| --- | --- | --- |
| Session id across refreshes | changed every refresh | stable |
| `created_at` | last rotation | original sign-in |
| Revoke by an id fetched earlier | 404 | works |
| Revoking a session | killed one credential | kills the session and every credential under it |

Replay detection is unchanged: presenting a rotated credential still revokes every session for
the account.

### Migration and compatibility

`035_stable_auth_sessions` is **additive only** — one new table, one nullable column. Nothing is
dropped, retyped, or made non-nullable, so the migration is safe to deploy before or after the
application code.

The backfill promotes each currently-**active** credential to a session and, critically, reuses
that credential's own id as the session id. Access tokens already in circulation carry that
value in their `session_id` claim, so signed-in users are not logged out by the deploy. Rotated
and revoked credentials are history and are deliberately left unlinked.

The resolver also accepts a legacy claim: if `session_id` does not name a session, it falls back
to the old refresh-token-row lookup, so tokens minted before the deploy keep working until they
expire and gain a stable session on their next rotation.
