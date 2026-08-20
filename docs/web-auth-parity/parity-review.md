# Web authentication parity review

Audited from `AuthenticationViews.swift`, `KlarioPasswordPolicy.swift`, `KlarioSession.swift`, and the shared backend auth routes on 20 August 2026.

## iOS source of truth

- **Create account:** Full name → Email address → Password → live password feedback → Confirm password → required Terms & Privacy acceptance → email OTP verification. Verification establishes the authenticated session and continues into onboarding/workspace.
- **Password policy:** 12–128 characters, uppercase, lowercase, number, and any non-letter/non-number/non-whitespace symbol. Confirmation only reports a mismatch after input begins. Password visibility is available for both password fields.
- **Forgot password:** Email → generic confirmation and a six-digit code → verification → new password/confirmation → success. The native app has resend cooldown support. Its code flow is an iOS client adaptation of the shared backend’s OTP recovery endpoints.
- **Web reset link:** The backend also supports web reset links at `/reset-password?token=…`; token is single-use and reset revokes sessions. That is platform-specific routing, not a different password policy.

| Flow | Behavior | iOS | Web before | Web after | Remaining gap |
|---|---|---|---|---|---|
| Sign up | Full name/email/password | Required | Missing confirmation/policy parity | Same field order plus confirmation | MATCHED |
| Sign up | Password policy | 12–128 + five rules | 8 characters only | Shared web mirror of iOS/backend rules | MATCHED |
| Sign up | Live feedback / visibility | Feedback + eye controls | None | Checklist, live summary, show/hide | MATCHED |
| Sign up | Terms acceptance | Required | Missing | Required unchecked agreement control | PARTIAL: web Terms/Privacy destinations are not implemented as public pages yet |
| Sign up | OTP verification | Required then authenticated/onboarding | Required | Retained | MATCHED |
| Forgot password | Generic response and code verification | Does not enumerate accounts | Sent a reset link only | Sends, verifies, and resends the same six-digit email code as iOS | MATCHED |
| Forgot password | Resend | OTP resend cooldown | No resend on link request | Not added: link flow has no documented resend contract | PLATFORM-SPECIFIC BY DESIGN |
| Reset link | Token handling | iOS code/reset-token flow | Token was removed even after network error | Token stays in component memory and URL is scrubbed only after success/invalidity | MATCHED for web-link contract |
| Reset password | Policy / confirmation / visibility | Required | 8-char policy, no visibility/feedback | Same shared policy, confirmation, checklist, show/hide | MATCHED |
| Reset success | Clear sign-in destination | Success then sign in | Immediate redirect | Explicit Password updated success state and Sign in action | MATCHED |
| Invalid token | Recovery path | Clear error/recovery | Raw disabled form | Clear invalid/expired message and fresh-link action | MATCHED |
| Auth cache safety | Clear protected state on reset/logout | Session lifecycle is cleared | Logout clears query cache | Retained and strengthened in the query-cache rollout | MATCHED |

## Files audited

- iOS: `Projects/App/BioLensApp/Sources/AuthenticationViews.swift`
- iOS: `Projects/Core/CoreBioLensAPI/Sources/KlarioPasswordPolicy.swift`
- iOS: `Projects/Core/CoreBioLensAPI/Sources/KlarioSession.swift`
- Backend: `app/api/v1/auth_routes.py`, `app/core/password_policy.py`
- Web: `components/register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `lib/api/client.ts`

## Validation limitation

The current project has no web test harness and the Simulator was not authenticated for screenshot capture. Source and production builds validate the implementation; real email/OTP/reset-link delivery requires a controlled test account and mail environment.
