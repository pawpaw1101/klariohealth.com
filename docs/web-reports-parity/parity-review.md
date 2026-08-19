# Web Reports parity review

## Scope

The web Reports root now follows the active iOS Reports hierarchy while adapting import choices for a desktop browser. Backend report authorization, parse state, editing, retry, and soft-delete behavior are unchanged.

| Area | iOS | Web before | Web after | Status / remaining gap |
|---|---|---|---|---|
| Root title | Reports | Reports | Reports | MATCHED |
| Search | Search reports | Search reports | Search reports | MATCHED |
| Profile filter | Profile menu | All profiles select | Profile select | MATCHED, desktop control adaptation |
| Type filter | Type menu | All types select | All types select | MATCHED, desktop control adaptation |
| Status filter | Not visible on active root | Visible status-chip strip | Removed from root | MATCHED; row status remains visible |
| Empty/error/loading | contextual empty, inline error, skeleton | shared empty/error/skeleton | shared empty/error/skeleton | MATCHED |
| Report row | icon, title, profile/type, summary, status, actions | same information in a broad desktop row | retained | MATCHED |
| Live status | server processing monitor | backend report status exposed a retry affordance even for extracted reports | status retained; retry control removed | PARTIAL: monitor polling presentation is backend-client specific |
| Open report | detail screen | detail route | detail route | PARTIAL: detail hierarchy is not fully audited/redesigned in this root pass |
| Edit metadata | Edit details | Edit modal | Edit modal | MATCHED for title/type |
| Edit parsed values | full edit screen | no corresponding web correction flow | unchanged | NOT IMPLEMENTED YET / backend-client capability needed |
| Delete | soft-delete confirmation | browser confirmation, soft archive | unchanged | PARTIAL: semantics match backend soft-delete; confirmation component still needs shared-dialog parity |
| Add Report | source chooser | opened a direct single-file form | source chooser: Photos, PDF/File, iOS scan exception | MATCHED for web-supported sources |
| Multi-item import | batch import with shared date/notes | one file per upload | unchanged | NOT IMPLEMENTED YET |
| Camera scanning | VisionKit | absent | clearly marked iOS-only | IOS-ONLY BY DESIGN |
| Recently deleted | Settings → Privacy & Data | not represented from Reports | remains outside root | BLOCKED BY WEB SETTINGS destination implementation |

## Files changed

- `components/workspaces/reports.tsx`
- `styles.css`
- `docs/web-reports-parity/ios-reports-audit.md`
- `docs/web-reports-parity/parity-review.md`

## Validation

Run `npm run typecheck` and `npm run build` after the implementation changes. Screenshot capture requires an authenticated test account; it has not been claimed in this audit.
