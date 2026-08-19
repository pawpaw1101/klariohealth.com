# Web Settings Parity Review

Audit date: 20 August 2026. iOS source of truth: `SettingsView.swift`, `AccountSecurityViews.swift`, `NotificationsRemindersViews.swift`, `SettingsSupportViews.swift`, `UnitPreferences.swift`, and `SecurityCenterView.swift`.

## Audit evidence

The iOS app built and launched successfully on the `Klario-UIAudit` simulator. Its runtime session was signed out, so authenticated Settings screenshots and interactive confirmation states could not be captured without credentials. This review is therefore source-audited, with the signed-out simulator state recorded as the visual-QA blocker. No synthetic authenticated evidence was fabricated.

## iOS inventory and parity matrix

| Section | Setting / action | iOS | Web before | Web after | Remaining gap |
|---|---|---|---|---|---|
| Account | Profile | Linked personal profile; warns when no safe link exists | Partial | MATCHED: opens linked personal profile | Profile editing remains in Family detail on both surfaces |
| Account | Email address / verified status | Read-only email, verified indicator | MATCHED | MATCHED | — |
| Account | Reset password | OTP recovery flow | Partial: direct current-password change | NOT IMPLEMENTED YET | Web does not expose the iOS OTP reset flow from Settings |
| Account | Active sessions | Device list, revoke other devices confirmation | Partial | MATCHED: sessions and revoke controls | Web should replace one-row revoke with a custom confirmation dialog |
| Account | Login activity | Full activity destination | Partial (five recent events) | PARTIAL | No paged activity destination |
| Account | Security alerts | Backend preferences | MISSING | BLOCKED BY BACKEND CLIENT: endpoint added, visual controls not yet added | Needs dedicated UI |
| Account | Security Center | Sessions, events, biometric/app-lock status | Partial | PARTIAL | Biometric and app lock are iOS-only by platform design |
| Account | Delete account | Capability-gated; biometric gate; preview; password reauth; type `DELETE` | Partial; browser confirm after password | PARTIAL | Web needs the same multi-step custom dialog; backend contract is present |
| Family & Access | Family members | Family tab | MATCHED | MATCHED: links to Family workspace | — |
| Family & Access | Switch family | Menu when multiple families | MATCHED | MATCHED | — |
| Family & Access | My invitations | Accept / decline inbound invites | MISSING | NOT IMPLEMENTED YET | Web has family invite management, but no inbound invitation inbox in Settings |
| Family & Access | Pending invites | Create, resend, revoke; role-gated | MATCHED in Family workspace | MATCHED: linked Family workspace | — |
| Family & Access | Archived profiles | Restore destination | MATCHED in Family workspace | MATCHED: linked Family workspace | — |
| Preferences | Notifications & Reminders | Delivery, event toggles, reminders, quiet hours | MISSING | PARTIAL: backend-backed event/email controls added | Reminders list and quiet-hours editor need web UI |
| Preferences | Units | Shared backend unit preferences | MATCHED | MATCHED | — |
| Preferences | Appearance | iOS-local, currently not rendered in root Settings | WEB-ONLY | IOS-ONLY BY DESIGN | No web setting added |
| Preferences | Trends preferences | iOS-local, currently not rendered in root Settings | WEB-ONLY | IOS-ONLY BY DESIGN | No web setting added |
| Connected Services | Apple Health | Route exists but says HealthKit sync is not available yet; root row is currently not rendered | MISSING | IOS-ONLY BY DESIGN / unavailable | Web accurately says no web control; no fake integration |
| Connected Services | Connected apps | Unsupported iOS route; root row currently not rendered | MISSING | BLOCKED BY BACKEND | Current API does not expose connections |
| Privacy & Data | Privacy & Data information | Storage and cache explanation | MATCHED | MATCHED | — |
| Privacy & Data | Recently deleted reports | Restore/delete workflow | MISSING | NOT IMPLEMENTED YET | Need a backend endpoint and web screen audit before exposing |
| Privacy & Data | Clear local cache | Device-local cache clear with confirmation | N/A | IOS-ONLY BY PLATFORM DESIGN | Browser storage/session behavior differs; sign out clears web session |
| Help & Support | Help Centre | In-app FAQ | MISSING | NOT IMPLEMENTED YET | FAQ content can be shared once approved |
| Help & Support | Contact support | Mail composer with diagnostics | MATCHED | MATCHED: mailto support | Browser cannot reliably provide iOS device diagnostics |
| Help & Support | Terms & Privacy | Placeholder/legal draft explicitly marked unapproved | MISSING | BLOCKED BY LEGAL CONTENT | No web legal link added until approved copy exists |
| Help & Support | App version | iOS app version/build | N/A | IOS-ONLY BY PLATFORM DESIGN | Web app/version representation differs |
| Account actions | Sign out | Confirmation; clears local device cache, retains server data | Partial | PARTIAL | Web uses existing backend logout; confirmation parity still required |

## Root causes found

The original web page combined account, security, privacy and family controls into one long stack. It had no category navigation, did not surface backend notification preferences, and used inconsistent destination semantics: several family controls existed elsewhere but were not discoverable from Settings. iOS also has some capability-gated flows that the web client either only partially renders (deletion) or has not wired to UI (notification/security preference APIs).

## Implemented web structure

- Desktop category navigation: Account, Family & Access, Preferences, Connected Services, Privacy & Data, Help & Support, and Sign out.
- Responsive horizontal category control below desktop width.
- Reused `Card`, `SectionHeader`, `StatusPill`, `ApiStatusBanner`, existing React Query loading/error handling, and existing backend role restrictions in Family.
- Added the shared notification-preference and security-alert API client methods. The former is now used for the supported notification controls.
- Connected Services explicitly distinguishes unavailable/unsupported services instead of presenting fake connect buttons.

## Screenshots and responsive QA

`docs/web-settings-parity/screenshots/` is intentionally not populated in this audit: the simulator had no authenticated demo session, and the in-app web browser surface was unavailable in this Codex session. Capture remains required after a demo account is supplied. Target widths: 1920, 1440, 1280, tablet, and 390px mobile.

## Platform-specific exceptions

- App lock / Face ID or Touch ID: iOS-only by platform design.
- Opening the OS notification settings: iOS-only by platform design.
- Clear downloaded cache: iOS device-local behavior; no equivalent web control is claimed.
- Apple Health / HealthKit: iOS integration and currently unavailable in the product.
- App version/build: iOS-specific display.
