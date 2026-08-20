# Klario Web Post-Login Rebuild Tasks

Source plan: "Klario web - post-login rebuild to match the iOS app".

Implementation target: `klariohealth.com`.

Reference-only repos:

- `../Biolens`: iOS app design system, assets, typography, icons, information architecture, screen behavior.
- `../Biolens_backend`: FastAPI API contracts and status semantics.

Governing rule: keep the website visual theme for colors, shadows, radii, light-only mode, and glassy navigation; use the iOS app as source of truth for typography files, logo assets, icons, component vocabulary, screen structure, copy, empty states, and feature behavior. Do not add dark mode.

## Phase 0 - Baseline And Guardrails

- [x] Capture the current website state before changes.
  - Inspect `app/layout.tsx`, `styles.css`, `components/app-shell.tsx`, `components/app-workspaces.tsx`, `components/brand.tsx`, `components/nav-icon.tsx`, `components/bio-icon.tsx`, `lib/klario-data.ts`, `lib/api/klario-api.ts`, and `lib/api/types.ts`.
  - Record the current post-login routes under `app/app/**`.
  - Confirm `components/app-workspaces.tsx` remains the main workspace shell to split.

- [x] Establish the no-dark-mode rule.
  - Verify `styles.css` has no `prefers-color-scheme` blocks before starting.
  - Keep `color-scheme: light` behavior only.
  - Do not port the iOS `appleGray*` or `appleBlack` dark tier.

- [x] Treat medical demo data as marketing-only.
  - Keep `lib/klario-data.ts` for marketing showcases.
  - Remove all post-login fallbacks to fabricated documents, family profiles, biomarker trends, timeline events, and app metrics as screens are rebuilt.

## Phase 1 - Typography

- [x] Copy app font files into the website.
  - Source: `../Biolens/Projects/App/BioLensApp/Resources/Fonts/`.
  - Destination: `public/fonts/`.
  - Files: `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`.
  - Files: `PlusJakartaSans-Regular.ttf`, `PlusJakartaSans-Medium.ttf`, `PlusJakartaSans-SemiBold.ttf`, `PlusJakartaSans-Bold.ttf`, `PlusJakartaSans-ExtraBold.ttf`.
  - Copy the `OFL/` license folder too.

- [x] Replace Google-hosted fonts with local fonts.
  - Edit `app/layout.tsx`.
  - Replace `next/font/google` usage with `next/font/local`.
  - Preserve CSS variable names `--font-body-next` and `--font-display-next`.
  - Current checkout uses `DM_Sans` and `Space_Grotesk`; replace those with app-bundled Inter and Plus Jakarta Sans.

- [x] Add app type tokens to `styles.css`.
  - Add to `:root`:
    - `--type-display-xl: 800 34px/1.12 var(--font-display);`
    - `--type-display-l: 700 28px/1.12 var(--font-display);`
    - `--type-display-m: 700 22px/1.2 var(--font-display);`
    - `--type-title-ui: 600 17px/1.3 var(--font-display);`
    - `--type-body-l: 400 17px/1.5 var(--font-body);`
    - `--type-body-m: 400 15px/1.5 var(--font-body);`
    - `--type-caption: 500 13px/1.4 var(--font-body);`
    - `--type-label: 600 12px/1.3 var(--font-body);`

- [x] Move post-login screens to type tokens.
  - Replace ad hoc post-login font sizes with the new tokens.
  - Leave marketing page sizing alone unless a shared class makes it unavoidable.

Acceptance:

- [ ] DevTools network shows `/fonts/*.ttf`.
- [x] No `fonts.gstatic.com` or Google font requests.
- [x] `npm run typecheck` passes.

## Phase 2 - Brand Assets And Favicon

- [x] Copy app brand assets into the website.
  - Source wordmark: `../Biolens/Projects/App/BioLensApp/Resources/Assets.xcassets/KlarioLogoLight.imageset/`.
  - Destination: `public/brand/`.
  - Copy `KlarioLogoLight.png` to `klario-wordmark.png`.
  - Copy `KlarioLogoLight@2x.png` to `klario-wordmark@2x.png`.
  - Copy `KlarioLogoLight@3x.png` to `klario-wordmark@3x.png`.
  - Source app icon: `../Biolens/Projects/App/BioLensApp/Resources/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png`.
  - Copy to `public/brand/klario-mark.png`.

- [x] Rebuild `components/brand.tsx`.
  - Keep existing `.logo`, `.logo-mark`, and related class names.
  - Render the `k.` mark inside the existing teal-gradient rounded square.
  - Replace text "Klario" with a `next/image` script wordmark image.
  - Use `alt="Klario"`.

- [x] Remove the fake logo icon.
  - Delete `logo` from `NavIconName` in `components/nav-icon.tsx` after all references are gone.
  - Keep nav-only icons such as menu, close, arrows, logout, and user in `components/nav-icon.tsx`.

- [x] Add browser and iOS bookmark icons.
  - Add `app/icon.png` from the `k.` mark.
  - Add `app/apple-icon.png` from the `k.` mark.

- [x] Use the real brand consistently.
  - Use the mark and wordmark in nav, auth pages, splash, and app shell.

Acceptance:

- [x] App nav shows script wordmark plus `k.` mark.
- [x] Login/register/reset pages use the real mark.
- [x] Browser tab favicon renders the Klario mark.

## Phase 3 - Icon System Resync

- [x] Copy missing iOS icons to the web.
  - Source: `../Biolens/Projects/App/BioLensApp/Resources/Assets.xcassets/*/*.svg`.
  - Destination: `public/icons/`.
  - Add `icon_doc_scan_import.svg`.
  - Add `icon_parser_confidence.svg`.
  - Add `icon_review_required.svg`.
  - Add `icon_signal_summary.svg`.
  - Add `icon_tab_settings.svg`.

- [x] Remove retired or web-only legacy icons after usages are remapped.
  - Remap and delete `icon_doc_import_panel.svg`.
  - Remap and delete `icon_doc_warning.svg`.
  - Remap and delete `icon_signal_confidence.svg`.
  - Remap and delete `icon_signal_critical.svg`.
  - Remap and delete `icon_signal_insights.svg`.
  - Remap and delete `icon_signal_low.svg`.
  - Remap and delete `icon_signal_warning.svg`.
  - Remap and delete `icon_sync_icloud.svg`.
  - Remap and delete `icon_sync_local.svg`.

- [x] Port `BioLensIcons.swift` to `lib/icons.ts`.
  - Add a `KlarioIconName` union matching the Swift `BioLensIconName` enum.
  - Port `DocumentType` to icon mapping.
  - Port `DocumentStatus` to icon mapping.
  - Port `ReviewStatus` to icon mapping.
  - Port `TimelineCategory` to icon mapping.

- [x] Type `components/bio-icon.tsx`.
  - Change the `name` prop from `string` to `KlarioIconName`.
  - Preserve the CSS mask rendering model.

- [x] Switch tab and section icons to app assets.
  - Use `icon_tab_dashboard`.
  - Use `icon_tab_trends`.
  - Use `icon_tab_documents`.
  - Use `icon_tab_family`.
  - Use `icon_tab_settings`.

Acceptance:

- [x] `npm run typecheck` catches stale icon names.
- [x] `rg "icon_signal_low|icon_signal_critical|icon_sync_icloud|icon_sync_local" components app lib` returns no post-login usages.

## Phase 4 - Klario Component Layer

- [x] Add `lib/tone.ts`.
  - Port `BioStatusTone`: blue, green, yellow, orange, red, gray, brand.
  - Map tones to existing website color tokens.
  - Port tone helpers for lab flags, document statuses, and review statuses.
  - Replace substring-based `statusClass()` logic in `components/app-workspaces.tsx`.

- [x] Create `components/klario-ui/`.
  - Add `Card`.
  - Add `IconBadge`.
  - Add `StatusPill`.
  - Add `FilterChip`.
  - Add `SearchField`.
  - Add `RootPageHeader` or extend `components/section.tsx`.
  - Add `MetricCard`.
  - Add `EmptyState`.
  - Add `Skeleton` primitives needed by workspace screens.
  - Add shared modal/drawer primitives only if required by multiple screens.

- [x] Add a `/* Klario app components */` section to `styles.css`.
  - Use website radii, border, shadow, and color tokens.
  - Keep cards at website radius scale, not iOS 20px radius.
  - Use type tokens from Phase 1.

Acceptance:

- [x] New workspace code imports shared Klario UI primitives instead of repeating one-off card, chip, metric, and search markup.
- [x] No nested card layouts are introduced.

## Phase 5 - App Information Architecture

- [x] Change app navigation to the iOS five-section IA.
  - Dashboard: `/app/dashboard`.
  - Trends: `/app/trends`.
  - Reports: `/app/reports`.
  - Family: `/app/family`.
  - Settings: `/app/settings`.

- [x] Update `lib/klario-data.ts` `appNav`.
  - Remove Upload as a top-level nav section.
  - Remove Documents as a top-level nav section.
  - Remove Attention, Timeline, Invites, and Account as independent nav items.
  - Add Settings to the main app nav.

- [x] Update `components/app-shell.tsx`.
  - Use app icon assets for five app sections through `BioIcon` where appropriate.
  - Keep shell-only controls in `NavIcon`.
  - Keep profile/account access as part of Settings or the member switcher pattern.

- [x] Preserve old URLs with redirects.
  - `/app/documents` redirects to `/app/reports`.
  - `/app/upload` redirects or opens the upload modal route behavior.
  - `/app/timeline` redirects to Reports timeline view.
  - `/app/attention` redirects or opens Dashboard attention inbox.
  - `/app/invites` redirects to Family invitations section.
  - `/app/account` redirects to `/app/settings`.
  - Keep existing detail routes working where applicable.

- [x] Add new route.
  - Add `/app/family/[memberId]` for family profile detail.

Acceptance:

- [x] The app nav shows exactly five primary sections.
- [x] Every retired URL resolves without a 404.

## Phase 6 - Workspace Split

- [x] Split `components/app-workspaces.tsx`.
  - Create `components/workspaces/dashboard.tsx`.
  - Create `components/workspaces/trends.tsx`.
  - Create `components/workspaces/reports.tsx`.
  - Create `components/workspaces/family.tsx`.
  - Create `components/workspaces/settings.tsx`.
  - Create `components/workspaces/shared.tsx`.

- [x] Move shared helpers into `components/workspaces/shared.tsx`.
  - `formatDate`.
  - `prettyStatus`.
  - `formatFileSize`.
  - `valueWithUnit`.
  - `Sparkline`.
  - Any normalized loading/error/empty helpers used by multiple screens.

- [x] Update route files under `app/app/**`.
  - Route pages should import the matching workspace component.
  - Keep server/client boundaries explicit.
  - Use redirects for retired route files.

Acceptance:

- [x] `components/app-workspaces.tsx` is removed or reduced to a temporary compatibility export.
- [x] Each primary section lives in its own file.
- [x] `npm run typecheck` passes after the split.

## Phase 7 - API Client Coverage

- [x] Extend `lib/api/types.ts`.
  - Add account types.
  - Add notification, display, and unit preference types.
  - Add sessions and security event types.
  - Add metric catalog and tracked metric/category types.
  - Add member update/delete types.
  - Add document update/delete types.
  - Add reminder types.
  - Add profile detail types.

- [x] Extend `lib/api/klario-api.ts` with account endpoints.
  - Reference: `../Biolens_backend/app/api/v1/account_routes.py`.
  - Add `GET /account`.
  - Add `GET/PATCH /account/notification-preferences`.
  - Add `GET/PATCH /account/display-preferences`.
  - Add `GET/PATCH /account/unit-preferences`.
  - Add `GET /account/sessions`.
  - Add `GET /account/security-events`.

- [x] Extend metric endpoints.
  - Reference: `../Biolens_backend/app/api/v1/metrics_routes.py`.
  - Add metric catalog calls.
  - Add tracked metric add/remove calls.
  - Add category visibility add/remove calls.

- [x] Extend member endpoints.
  - Reference: `../Biolens_backend/app/api/v1/member_routes.py`.
  - Add `PATCH /members/{id}`.
  - Add `DELETE /members/{id}`.

- [x] Extend document endpoints.
  - Reference: `../Biolens_backend/app/api/v1/document_routes.py`.
  - Add `PATCH /documents/{id}`.
  - Add `DELETE /documents/{id}`.

- [x] Extend reminder endpoints.
  - Reference: `../Biolens_backend/app/api/v1/reminder_routes.py`.
  - Add `/account/reminders` list/create/update/delete operations needed by Settings.

- [x] Extend profile endpoints.
  - Reference: `../Biolens_backend/app/api/v1/profile_routes.py`.
  - Add health profile detail reads and updates for Family profile detail.

Acceptance:

- [x] Settings no longer persists preferences only in client state.
- [x] Trends Add Metrics flow talks to the backend catalog/tracking endpoints.
- [x] Reports delete and rename call backend APIs.
- [x] Family member detail edits call backend APIs.

## Phase 8 - Reports Workspace

- [x] Rebuild Reports from the app Documents feature.
  - Reference: `../Biolens/Projects/Features/DocumentsFeature/Sources/DocumentsView.swift`.
  - Header title: `Reports`.
  - Subtitle: `Your Klario medical documents and processing status.`
  - Add `SearchField`.
  - Add horizontal filter bar with member menu, type menu, and clear control.
  - Render `DocumentCard` rows with icon badge, status pill, metadata, and overflow menu.
  - Add skeleton and empty states matching app copy.

- [x] Implement report actions.
  - Open detail.
  - Rename report via backend patch endpoint.
  - Soft-delete report via backend delete endpoint.
  - Use confirmation wording: `Klario will soft-delete this report and remove it from your dashboard and trends.`

- [x] Re-skin report detail page.
  - Preserve parsed results.
  - Preserve attention items.
  - Preserve parser runs.
  - Use Klario component layer and typed tones.

- [x] Move upload into modal.
  - Launch from floating add button based on `BioReportQuickAddButton`.
  - Reuse `lib/api/upload.ts`.
  - Keep `/app/upload` as redirect or modal-entry route behavior.

Acceptance:

- [x] Empty signed-in backend shows no fabricated reports.
- [x] Delete and rename round-trip against the backend.

## Phase 9 - Family Workspace

- [x] Rebuild Family from the app Family feature.
  - Reference: `../Biolens/Projects/Features/FamilyFeature/Sources/FamilyView.swift`.
  - Header subtitle: `Every report and result stays scoped to the selected Klario profile.`
  - Add family name header and actions.
  - Use deterministic avatar gradients.
  - Add active member cards.
  - Add archived profiles section.
  - Add pending invitations section, absorbing `/app/invites`.
  - Add the `About Family` explainer.

- [x] Add member detail page.
  - Reference: `../Biolens/Projects/Features/FamilyFeature/Sources/FamilyProfileDetailView.swift`.
  - Route: `/app/family/[memberId]`.
  - Show profile details from backend profile endpoints.
  - Support member edit and delete/archive actions through backend endpoints.

Acceptance:

- [x] `/app/invites` resolves into the Family experience.
- [x] Empty family/member states use app empty state copy.
- [x] No hardcoded `familyProfiles` records appear post-login.

## Phase 10 - Settings Workspace

- [x] Rebuild Settings from the app Settings feature.
  - Reference: `../Biolens/Projects/App/BioLensApp/Sources/SettingsView.swift`.
  - Include account section.
  - Include active family/member section.
  - Include notification preferences.
  - Include display preferences.
  - Include unit preferences.
  - Include reminders if supported by API.
  - Include privacy and data copy from app lines around `SettingsView.swift:474-481`.
  - Include environment, cache/refresh, and sign out.

- [x] Persist settings through backend APIs.
  - Replace current client-only toggles.
  - Show loading, error, and saved states.

- [x] Absorb account route.
  - Redirect `/app/account` to `/app/settings`.
  - Move profile/security/account controls into Settings.

Acceptance:

- [x] Preferences survive reload.
- [x] Sessions and security events render from backend when available.

## Phase 11 - Trends Workspace

- [x] Rebuild Trends root from the app Trends feature.
  - Reference: `../Biolens/Projects/Features/TrendsFeature/Sources/TrendsView.swift`.
  - Add root header with tracked-metric count subtitle.
  - Add `SearchField`.
  - Add member filter chip.
  - Add flagged-only filter chip.
  - Add clear filters action.
  - Replace flat grid with category accordions.
  - Add `AddMetricsCard`.
  - Add metric category picker wired to backend catalog/tracking APIs.
  - Add skeleton and empty states from the app.

- [x] Update trend detail page.
  - Reference: `KlarioTrendDetailView.swift` and `BioTrendChartFrame.swift`.
  - Add app range chips.
  - Add chart frame styling.
  - Keep existing `Sparkline` renderer initially.
  - Add axis/reference-band treatment.

Acceptance:

- [x] Metric tracking changes round-trip to backend.
- [x] Empty trends state shows no fabricated biomarkers.

## Phase 12 - Body Visualization

- [x] Create `components/body-visualization.tsx`.
  - Reference: `../Biolens/Projects/Features/DashboardFeature/Sources/BodyVisualizationView.swift`.
  - Reference: `../Biolens/Projects/Features/DashboardFeature/Sources/BodyMapView.swift`.
  - Reference: `../Biolens/Projects/Features/DashboardFeature/Sources/BodyMapSnapshot.swift`.
  - Use SVG, not canvas.

- [x] Port body silhouette geometry.
  - Use fixed `viewBox="0 0 200 460"`.
  - Transcribe the Swift path into one SVG path.
  - Map `addQuadCurve` to `Q`.
  - Map `addCurve` to `C`.

- [x] Port body system zones.
  - Reference: `../Biolens/Projects/Core/CoreModels/Sources/BodySystemZone.swift`.
  - Add brain.
  - Add thyroid.
  - Add lungs.
  - Add cardio.
  - Add liver.
  - Add metabolic.
  - Add kidney.
  - Add blood.
  - Add inflammation as rim zone only.
  - Copy display names and `noDataSummary` strings verbatim.
  - Preserve side assignments from `bodyZoneSides`.

- [x] Port particle field.
  - Implement seeded Lehmer/Park-Miller LCG with seed `7`.
  - Generate 1100 ambient dots against the silhouette mask.
  - Use the three drift groups from the Swift source.
  - Use CSS or SMIL transforms on grouped SVG elements.
  - Disable animation under `prefers-reduced-motion`.

- [x] Port state coloring.
  - Map `noData` to gray.
  - Map `normal` to green.
  - Map `attention` to orange.
  - Map `critical` to coral.
  - Ensure critical never falls through to green.

- [x] Port `BodyMapBuilder.build`.
  - Combine dashboard `needs_attention[]` with trends data.
  - Avoid treating all-normal zones as no-data just because `needs_attention[]` is sparse.

- [x] Add zone interaction.
  - Clicking a zone navigates to `/app/trends/{metricId}` for that zone primary metric.

- [x] Port tiles mode.
  - Implement `BodyTilesView` equivalent.
  - Share the same zone snapshots and tones with the body map.

Acceptance:

- [ ] Body visualization scales at 375px, 768px, and 1440px without horizontal scroll.
- [x] Reduced-motion mode has no particle animation.
- [x] Critical zones render coral and never green.

## Phase 13 - Dashboard Workspace

- [x] Rebuild Dashboard from the app Dashboard feature.
  - Reference: `../Biolens/Projects/Features/DashboardFeature/Sources/DashboardView.swift`.
  - Add header with brand and member switcher pill.
  - Member switcher uses gradient initial avatar and chevron menu.
  - Add Body/Tiles segmented control matching `BodyMapDisplayMode`.
  - Mount body visualization from Phase 12.
  - Add flag strip with Normal, Attention, Critical, and Score chips.
  - Clicking flag strip opens metric-list modal equivalent to `DashboardMetricListSheet`.
  - Add attention inbox drawer equivalent to `KlarioAttentionInboxView`.
  - Add import progress section for in-flight uploads.
  - Add server banner for `dashboard.banner`.

Acceptance:

- [x] `/app/attention` is no longer needed as a standalone primary workflow.
- [x] Dashboard body map and flag strip use live backend dashboard/trends data.
- [x] Empty backend shows skeletons or empty states, not demo metrics.

## Phase 14 - First-Visit Splash Screen

- [x] Add Lottie runtime.
  - Add `lottie-react` to `package.json`.
  - Update `package-lock.json`.

- [x] Author `public/lottie/klario-splash.json`.
  - Use an image layer with base64-embedded `klario-wordmark@3x.png`.
  - Animate wordmark opacity `0` to `100`.
  - Animate wordmark scale `92` to `100` over about `0.6s`.
  - Add teal dot shape layer `#0d9488` with pop/overshoot.
  - Add low-opacity teal pulse ring that expands and fades.
  - Use transparent background.
  - Total duration about `1.6s` at `60fps`, then hold.

- [x] Create `components/splash-screen.tsx`.
  - Client component.
  - Fixed full-viewport overlay above all content.
  - Background uses `--bg-hero`.
  - Center the Lottie animation.
  - Add `role="status"` and `aria-label="Loading Klario"`.
  - Fade out with `--transition-slow`.
  - Unmount after completion.

- [x] Create `components/splash-gate.tsx`.
  - Client component.
  - Use `localStorage["klario.splash.seen"]`.
  - Render nothing during SSR.
  - Returning visitors must not see a flash.
  - Under `prefers-reduced-motion: reduce`, show static wordmark for about `400ms`, set seen flag, and dismiss.

- [x] Mount splash gate in `app/layout.tsx`.
  - Mount inside `<body>`, above `<AmbientEffects />`.
  - Covers marketing and workspace routes.

- [x] Add splash styles to `styles.css`.
  - Add `.splash-overlay` block.
  - Include reduced-motion styles.

Acceptance:

- [x] First visit after clearing localStorage plays once and fades.
- [x] Reload does not show splash.
- [x] Reduced-motion users see static wordmark briefly with no animation.
- [x] No hydration warning appears.

## Phase 15 - Ambient Effects Integrity

- [x] Gate ambient WebGL and custom cursor away from post-login routes.
  - Edit `components/ambient-effects.tsx`.
  - Do not initialize WebGL background on `/app/**`.
  - Do not initialize particle canvas on `/app/**`.
  - Do not initialize custom cursor on `/app/**`.
  - Keep scroll/reveal behavior where it is still used.

Acceptance:

- [x] Workspace pages are not competing with marketing particle effects.
- [x] Marketing pages keep their existing visual effects.

## Phase 16 - Final Cleanup

- [x] Remove post-login usage of marketing demo data.
  - Search for `documents`, `familyProfiles`, `biomarkerTrends`, `timelineEvents`, and `appMetrics` imports in post-login code.
  - Replace with API data plus skeletons/empty states.

- [x] Remove stale one-off workspace classes from `styles.css`.
  - Delete or retire `.metric`, `.record`, `.status-chip`, `.pill-button`, and old search field styles after replacement.
  - Keep classes still used by marketing or shared layout.

- [x] Update README.
  - Replace old eight-section app route list with the five-section IA.
  - Document the backend reference path.
  - Document local font/brand asset expectations.

- [x] Check route aliases.
  - Confirm `/app/documents`.
  - Confirm `/app/upload`.
  - Confirm `/app/timeline`.
  - Confirm `/app/attention`.
  - Confirm `/app/invites`.
  - Confirm `/app/account`.

Acceptance:

- [x] `rg "Joel|familyProfiles|biomarkerTrends|timelineEvents|appMetrics" app components lib` shows no post-login rendered demo usage.
- [x] `rg "prefers-color-scheme" styles.css` returns no matches.

## Phase 17 - Verification

- [x] Run static checks.
  - `npm run typecheck`.
  - `npm run build`.

- [ ] Run local app.
  - `npm run dev`.
  - Open `/`.
  - Open `/login`.
  - Open `/app/dashboard`.
  - Walk Dashboard, Trends, Reports, Family, Settings.

- [ ] Verify splash.
  - Clear `localStorage`.
  - Hard reload `/`.
  - Confirm Lottie plays once and fades.
  - Reload and confirm it does not replay.
  - Force reduced motion and confirm static wordmark path.

- [ ] Verify brand and fonts.
  - Confirm real script wordmark in nav and auth pages.
  - Confirm `k.` mark in nav, favicon, splash, and app shell.
  - Confirm self-hosted font requests.
  - Confirm no Google font requests.

- [x] Verify route compatibility.
  - `/app/upload`.
  - `/app/timeline`.
  - `/app/attention`.
  - `/app/invites`.
  - `/app/account`.
  - `/app/documents`.

- [ ] Verify empty backend behavior.
  - Sign in with empty or unreachable backend.
  - Confirm every workspace shows skeletons or empty states.
  - Confirm no fabricated medical values, names, or flags render.

- [ ] Verify live backend behavior.
  - Sign in against a Klario environment with at least one parsed report.
  - Confirm dashboard flags.
  - Confirm body-map zone colors.
  - Confirm trends categories and detail view.
  - Confirm report detail.
  - Confirm attention accept/reject flows.
  - Confirm preference persistence.

- [ ] Verify responsive behavior.
  - Test 375px.
  - Test 768px.
  - Test 1440px.
  - Confirm no horizontal scroll.
  - Confirm body visualization scales with its viewBox.

- [ ] Verify light-only behavior.
  - Toggle OS dark mode.
  - Confirm site appearance does not change.
  - Confirm no `prefers-color-scheme` styles were added.

## Suggested Implementation Order

1. Typography and brand assets.
2. Icon resync and `lib/icons.ts`.
3. Klario component layer.
4. App IA and workspace file split.
5. API client coverage.
6. Reports.
7. Family.
8. Settings.
9. Trends.
10. Body visualization.
11. Dashboard assembly.
12. Splash screen.
13. Ambient effects gating and demo-data cleanup.
14. README update and full verification.
