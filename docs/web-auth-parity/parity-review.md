# Create Account / Forgot Password / Reset Password — iOS ↔ Web parity review

Reviewed 2026-08-21.

Sources of truth:
- iOS `Projects/App/BioLensApp/Sources/AuthenticationViews.swift`, `Projects/Core/CoreBioLensAPI/Sources/KlarioPasswordPolicy.swift`
- Web `components/register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `lib/password-policy.ts`

## Method

Both platforms were captured from running software, not read from source.

- **iOS** — real app on iPhone 17 Pro (iOS 26.3) simulator, Light Mode, driven by the
  `BioLensUITests` XCUITest target against a **local** backend
  (`BIOLENS_API_BASE_URL=http://127.0.0.1:8010`, stub email provider, synthetic accounts). No
  production Resend, Supabase or customer data was touched.
- **Web** — real production build served locally against the same backend, captured over CDP at
  1440×900 @2x, and again at 420×900 for the responsive check.

Screenshots are written to `docs/web-auth-parity/screenshots/{ios,web}/` when the capture is
run. They are git-ignored on purpose: they are regenerable build output, and binaries of
application screens do not belong in the repository.

### Why five iOS states and not ten

States 06–10 all sit past a form submission inside the Forgot Password sheet
(`email → code → newPassword → success`). Driving them needs repeated text entry into SwiftUI
secure fields, and XCUITest could not reliably do it here: fields that are visibly focused
report `isHittable == false`, and synthesised taps on them raise
*"Neither element nor any descendant has keyboard focus"*. Each retry costs a full
build-and-run cycle. The remaining states are marked BLOCKED rather than guessed at.

**Unblock path:** add stable `accessibilityIdentifier`s to the Forgot Password sheet's email,
code, password and confirm fields, then address them by identifier instead of by
placeholder/label. That is a small, production-safe change — identifiers do not alter
behaviour — but it is a change to app source that this task's brief asked to avoid unless
required, so it is left as a decision rather than made unilaterally.

## State table

| State | Contract parity | Visual parity | Notes |
|---|---|---|---|
| 01 Sign In | MATCHED | **MATCHED** | Same composition after the desktop-card fix: brand header, centred card, email → password → primary action. |
| 02 Create Account initial | MATCHED | **MATCHED** | Field order identical; heading and sub-copy now identical. |
| 03 Password partial | MATCHED | **MATCHED** | Was a mismatch — fixed. See "Fixes made". |
| 04 Create Account valid | MATCHED | **PARTIAL** | Password-valid state matches ("This password meets every requirement.", teal bars). The terms checkbox could not be toggled on iOS — see below — so the *button-enabled* frame is unconfirmed on iOS. |
| 05 Forgot Password | MATCHED | **MATCHED** | Heading, helper copy and button label now identical after the fix. |
| 06 Forgot Password submitted | MATCHED | **BLOCKED** | iOS capture blocked (above). |
| 07 Create New Password | MATCHED | **BLOCKED** | iOS capture blocked. |
| 08 Password mismatch | MATCHED | **PARTIAL** | iOS mismatch styling was captured incidentally on Create Account ("Passwords do not match", coral field border + coral caption) and web matches that treatment; the Reset-screen instance is unconfirmed. |
| 09 Invalid / expired link | MATCHED | **BLOCKED** | iOS capture blocked. |
| 10 Reset success | MATCHED | **BLOCKED** | iOS capture blocked. |

## Visual mismatches found, and fixed

Each was proven by comparing the two screenshots, not inferred.

| # | Mismatch | iOS | Web (before) | Fix |
|---|---|---|---|---|
| 1 | Password feedback presentation | 5 segmented 3px bars + one sentence | Bordered card titled "Password requirements" + a 5-item ✓/○ checklist + sentence | Web rewritten to the bar-and-sentence form (`components/password-requirements.tsx`) |
| 2 | "Still needed" wording | Long form: *"at least 12 characters and a special symbol (@, #, !, $)"* | Short chip labels: *"12+ characters and special character"* | Added `shortfall` phrases and iOS's `joined()` rule to `lib/password-policy.ts` |
| 3 | Summary sentence | "…with **a mix of** uppercase…" | "…with uppercase…" | Adopted iOS's string verbatim as `PASSWORD_SUMMARY` |
| 4 | Terms label | "I agree to the Terms of Service and Privacy Policy" | "I agree to the Privacy Policy and Terms & Conditions." | Web now uses iOS's wording and order |
| 5 | Forgot Password heading | "Forgot password?" | "Reset your Klario password." | Aligned |
| 6 | Forgot Password helper | "Enter the email associated with your Klario account." | "Enter your email and Klario will send a verification code if the account is eligible." | Aligned |
| 7 | Forgot Password button | "Send verification code" | "Send reset code" | Aligned |
| 8 | Desktop composition | One centred card | Two-column marketing split with the form in a side rail | Auth pages are now a centred 460px card (Task 7); marketing bullets hidden on these routes |
| 9 | Auth card surface | Solid card | Section gradient sized for a two-column layout, painting only part of the card | Explicit surface, border, radius and shadow |

## Known remaining differences

| Aspect | iOS | Web | Status |
|---|---|---|---|
| Field affordance | Icon inside each input (person / envelope / lock), placeholder only | Label above input, no icon | PARTIAL — deliberate: visible labels are the accessible pattern for pointer/screen-reader use |
| Nested container | Single card | Form and footer note each carry their own surface inside the card | PARTIAL — cosmetic card-in-card, not yet flattened |
| Flow container | Segmented Sign In / Create Account | Separate `/login` and `/register` routes | PLATFORM-SPECIFIC BY DESIGN — the web needs linkable URLs |
| Password visibility | Eye glyph | `Show` text button | PLATFORM-SPECIFIC BY DESIGN |

## Defect found in iOS while capturing

The Create Account **terms checkbox does not respond to synthesised taps**. In
`TermsAgreementView` the button's label is a bare `Image` with `.frame(width: 44, height: 44)`
and `.buttonStyle(.plain)`, but no `.contentShape(Rectangle())`. Without it SwiftUI hit-tests
the drawn glyph rather than the 44pt frame — and the accessibility frame confirms this, reporting
**18.7 × 18.7pt**, well under the 44pt minimum target.

Three independent tap mechanisms (element tap, element-relative coordinate, absolute screen
coordinate, each landing dead-centre on the reported frame) all failed to toggle it. This is
reported, not fixed: it is production app behaviour and outside this task's remit. Worth a
human check on a physical device, since it would also make the control hard to hit for users
with reduced motor precision.
