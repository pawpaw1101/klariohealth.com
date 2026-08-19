# Web data cache audit and rollout

Audited 20 August 2026. Klario uses **TanStack Query v5** for client data loading; no SWR, Redux/Zustand cache, React Query persistence plugin, service-worker cache, IndexedDB query persister, or Next server-fetch cache was found for authenticated workspace data.

## Existing problems

- The QueryClient had one 30-second global stale time but no resource-specific policy.
- Protected query keys were keyed only by resource/family/member. Logout cleared the cache, but a second identity signing in without an explicit logout did not have a defence-in-depth key partition.
- Report processing, settings, and catalog data all had the same freshness behavior.
- Page queries already retained data while mounted, but cache behavior was not defined or documented centrally.

## Strategy implemented

`lib/query-cache.ts` is the sole query-cache policy module. The cache remains **in-memory only** and is intentionally not persisted.

| Freshness class | Applies to | Stale time | Garbage-collection time | Revalidation |
|---|---|---:|---:|---|
| Processing | Reports list/detail, pending invitations | 10 seconds | 10 minutes | On stale mount, reconnect, and focus |
| Workspace | Dashboard, reports timeline, family profiles, trends/detail, attention | 60 seconds | 20 minutes | On stale mount, reconnect, and focus |
| Account | Settings/account/security/preferences and family context | 5 minutes | 30 minutes | On stale mount, reconnect, and focus |
| Catalog | Metric catalog/categories | 15 minutes | 60 minutes | On stale mount/reconnect; no focus refetch |

TanStack Query renders a cached value immediately. When its selected freshness period has elapsed, the existing value remains rendered while React Query refreshes it in the background. Query data is replaced only by the backend response; a background error preserves the last valid response.

## PHI safeguards and identity isolation

- No query payload is written to `localStorage`, `sessionStorage`, IndexedDB, Cache API, or a service worker.
- Query keys use `['klario', 'protected', userId, resource, ...family/member/detail identity]`. Query identity is therefore partitioned by authenticated user, family, member, report, metric range, and filters as applicable.
- Authentication tokens remain outside React Query and follow the existing `sessionStorage` contract. Passwords, reset tokens, document binaries, raw OCR text, and signed download URLs are not query-cached.
- `clearSessionState()` clears the entire QueryClient before the signed-out state is rendered. OTP login also clears the QueryClient before loading the newly authenticated user, preventing User A → User B leakage even if the prior logout flow was skipped.
- A 401, and explicit 403 session/revocation errors, dispatch the existing session-expired path, which clears the protected cache immediately.

## Invalidation map

| Mutation/event | Invalidated protected resources |
|---|---|
| Upload, parse completion, archive/restore, parsed result changes | Reports, Dashboard, Trends, Metrics, Attention |
| Family member/profile/invite changes | Profiles, Invitations, workspace dependent data |
| Family switch | New family context is loaded under a different family-scoped query key; the rendered view cannot reuse the prior family’s data |
| Unit or notification preference changes | Query refetches the affected account preference resource |
| Account/session sign out or expiry | Entire QueryClient is cleared |

## Special cases

- **Report processing:** processing cache has the shortest freshness period, so a cached Processing state appears immediately but is revalidated quickly on return/focus.
- **Trends:** every detail cache key includes family, member, metric, and range (`week`, `month`, `6m`, `year`, `all`), so ranges cannot be mixed.
- **Settings:** account, sessions, security events, unit preferences, deletion preview, and notification preferences use the slower account policy. Switching Settings sections reuses their in-memory query data without persisting PHI.
- **Signed document URLs:** `documentsApi.downloadUrl()` remains an action-time request and is not stored in the query cache.
- **Route prefetch:** no API prefetch was added. Framework link prefetch may fetch route code, but proactively fetching protected health payloads was intentionally avoided.

## Validation and remaining test work

`npm run typecheck` and `npm run build` must be run after the final changes. The project currently has no test runner or browser-performance harness, so the requested logout/identity and stale-while-revalidate cases cannot be added as executable tests without first choosing and adding a test framework. No request-count or latency claim is made without an authenticated browser-network capture.

Recommended follow-up test cases when the project’s test tooling is selected: no-cache loader; fresh/stale cached render; refresh failure retains data; processing → ready refresh; mutation invalidation; logout/User A→B cache clear; family revocation; signed URL freshness; range key separation; and query deduplication.
