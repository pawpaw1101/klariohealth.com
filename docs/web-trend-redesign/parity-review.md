# Web Trend UI Redesign — Parity Review

## 1. Root Cause Analysis

### Root cause of huge chart
The original chart component was built using a `.sparkline` SVG element mapped to `width: 100%` but lacked a constrained height. Because SVGs scale proportionally by default, wide desktop viewports (e.g., 1440px or 1920px width) caused the chart to stretch vertically, generating hundreds of pixels of vertical whitespace and pushing the axis boundaries off-screen.

### Root cause of the grey rectangle
The "grey rectangle" reference range band was incorrectly implemented as an absolutely positioned HTML `<div>` overlaid on top of the SVG frame using arbitrary CSS (`inset: 34% 16px auto; height: 28%;`). It was entirely disconnected from the actual SVG coordinate space, meaning it could not correctly bound the reference values (e.g., 70–99 mg/dL) against the dynamic plot data.

## 2. Redesign Implementation Details

### Chart Component Details
- **Chart Component Used:** A heavily upgraded bespoke SVG implementation (`InteractiveTrendChart`) in `shared.tsx`. This avoids the bloat of heavy external charting libraries while giving total control over Klario's precise design tokens and responsiveness.
- **Files Modified:**
  - `components/workspaces/trends.tsx`: Restructured the entire layout grid, header, and 5-column summary cards.
  - `components/workspaces/shared.tsx`: Rewrote the `InteractiveTrendChart` logic to support robust coordinate scaling, dynamic markers, axes, and interactive tooltips.
  - `styles.css`: Removed the broken `.trend-reference-band` and cleaned up grid stretching constraints.
- **New Chart Dimensions:** The `InteractiveTrendChart` uses an internal viewBox of `800x360` mapped cleanly to a `height: 420px` card container. It remains fully responsive and does not scale infinitely.

### Axis and Band Implementation
- **Y-Axis Domain Logic:** The vertical domain dynamically calculates boundaries by combining both the empirical `validMin/validMax` (observed readings) and `referenceMin/referenceMax` (the medical baseline bounds). It adds ~15% padding to the top and bottom to ensure the reference band never crashes into the chart edges.
- **Reference-Band Implementation:** Drawn as a native SVG `<rect>` behind the plot data. It correctly maps its `y` and `height` using the precise `getY` scale interpolator. Styled with `opacity="0.12"` to ensure subtleness without obscuring grid lines.

### Styling & Interactivity
- **Status Color Mapping:** Points map strictly to iOS semantic flags (e.g., `normal` -> green, `above_range` -> orange). Historical points are rendered at `r=4`, while the latest reading is emphasized at `r=7` with a pronounced white stroke.
- **Tooltip Behavior:** Uses a React state-driven absolute `div` overlay mapping hovering on widened, transparent invisible `<circle>` hit areas. It displays the reading value, unit, status pill, and reference range bounds securely without exposing internal backend UUIDs.
- **Responsive Behavior:** The layout is clamped to a centered max-width of `1360px` with `24px` horizontal padding. The summary cards leverage `auto-fit` to wrap gracefully on smaller displays, while the `InteractiveTrendChart` maintains strict aspect boundaries avoiding 100vh stretch scenarios.

## 3. QA Results

Playwright tests ran successfully across `1440x900` and `1920x1080` breakpoints, capturing the following states:
1. Normal ranges with multiple points and dynamic Y-padding.
2. Out-of-range emphasis.
3. Tooltip visibility and overflow protection.
4. "Trend unavailable" fallback states for single-reading views.
5. "Reference range unavailable" graceful degradation.

All screenshots have been verified and saved locally at `/docs/web-trend-redesign/`. The structural issues are fully resolved, and visual parity with the iOS desktop counterpart has been achieved.
