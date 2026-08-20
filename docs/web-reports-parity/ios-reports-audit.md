# iOS Reports audit

Audited from the active SwiftUI implementation on 20 August 2026. This is a source-code inventory, not a reconstruction from screenshots.

## Active iOS structure

`BioLensApp.swift` exposes **Reports** as the `DocumentsView` tab. Its root (`DocumentsView.swift`) contains:

1. **Reports** root title.
2. **Search reports** field.
3. Horizontal filters: **Profile** (family member picker) and **Type** (All Types plus every `DocumentType`). **Clear** appears after a type/search filter is set. The view model has a status-filter capability, but the active root does not render a status filter.
4. Inline error card, loading skeleton, and contextual empty states: **No reports yet** / **No matching reports**.
5. Report cards: document-type icon, title, `Profile · Type`, two-line summary, live processing state or status pill, and overflow actions **Open**, **Edit details**, **Delete**.
6. Pull to refresh.

## Report destinations and actions

| iOS entry | Destination/action | Notes |
|---|---|---|
| Open | `KlarioDocumentDetailView` | Shows title, backend processing status, date/type/result count, partial-OCR warning, attention values, parsed results grouped by backend category, provenance, and original document. |
| Edit details (row) | `ReportEditView(scope: .detailsOnly)` | Metadata only: title and type. |
| Edit (detail) | `ReportEditView(scope: .full)` | Metadata plus user-correctable parsed values; unsaved dismissal has a discard confirmation. |
| Delete | native confirmation dialog | Soft-deletes and says it removes the report from dashboard and trends. |
| Add Report | `ReportAddOptionsSheet` | **Scan Document**, **Choose from Photos**, **Import PDF or File**. |
| Add source chosen | `BatchImportSheet` | Supports multiple source items; shared Member, Date, optional notes, per-report name/type, then **Save & parse** / **Import all**. |

## Status and permission semantics

- Per-row processing is server-authoritative via `KlarioReportProcessingMonitor`; a retry control appears only when that monitor allows retry.
- Parsing outcomes use a shared status-pill language: completed/confirmed green, needs review orange, failed red, and in-progress blue/brand.
- Editing affordances are capability-gated client-side and rechecked by the backend; deletion is a soft delete.
- Recent deleted reports is intentionally outside Reports, under iOS Settings → Privacy & Data.

## Platform-specific exception

**Scan Document** uses iOS `VisionKit` camera scanning and is iOS-only by platform design. The web must not present a fake scanner; it may direct people to the iOS app while offering browser file/photo selection.

## Source files audited

- `Projects/App/BioLensApp/Sources/BioLensApp.swift`
- `Projects/Features/DocumentsFeature/Sources/DocumentsView.swift`
- `Projects/Features/DocumentsFeature/Sources/KlarioDocumentDetailView.swift`
- `Projects/Features/DocumentsFeature/Sources/ReportEditView.swift`
- `Projects/Features/DocumentsFeature/Sources/ReportImportPresentation.swift`
