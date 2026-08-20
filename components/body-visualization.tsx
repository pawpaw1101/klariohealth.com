"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DashboardAttentionItem, DashboardResponse, TrendPreview } from "@/lib/api/types";
import { toneClass, type BioStatusTone } from "@/lib/tone";
import { BioIcon } from "@/components/bio-icon";
import type { KlarioIconName } from "@/lib/icons";
import { prettyStatus } from "@/components/workspaces/shared";

export type BodySystemZone = "brain" | "thyroid" | "lungs" | "cardio" | "liver" | "metabolic" | "kidney" | "blood" | "inflammation";
type BodyZoneState = "noData" | "normal" | "attention" | "critical";

interface BodyMetric {
  id: string;
  name: string;
  value: number | string | null;
  unit: string | null;
  statusTitle: string;
  state: Exclude<BodyZoneState, "noData">;
}

interface BodyZoneSnapshot {
  zone: BodySystemZone;
  state: BodyZoneState;
  primaryMetric: BodyMetric | null;
  metricCount: number;
}

export const zoneDisplayNames = {
  brain: "Brain & Nerves",
  thyroid: "Thyroid",
  lungs: "Lungs",
  cardio: "Cardiovascular",
  liver: "Liver",
  metabolic: "Metabolic",
  kidney: "Kidneys",
  blood: "Blood",
  inflammation: "Inflammation"
} satisfies Record<BodySystemZone, string>;

/// Mirrors `BodyZoneCategoryPresentation.symbolName` on iOS — the closest available web asset
/// for each SF Symbol, so the pill icons read at the same weight and visual importance.
const zoneIcons = {
  brain: "icon_zone_brain",
  thyroid: "icon_zone_thyroid",
  lungs: "icon_zone_blood",
  cardio: "icon_zone_cardio",
  liver: "icon_zone_liver",
  metabolic: "icon_zone_metabolic",
  kidney: "icon_zone_kidney",
  blood: "icon_zone_blood",
  inflammation: "icon_zone_inflammation"
} satisfies Record<BodySystemZone, KlarioIconName>;

export const bodyZoneNoDataSummary = {
  lungs: "No respiratory markers tracked yet - these usually come from a spirometry or allergy panel.",
  thyroid: "No thyroid markers yet - a TSH / T4 panel would light this up.",
  brain: "No neurological markers yet - B12, folate and homocysteine map here.",
  cardio: "No heart or lipid markers yet - a lipid panel would light this up.",
  liver: "No liver markers yet - ALT, AST or bilirubin map here.",
  metabolic: "No metabolic markers yet - glucose or HbA1c map here.",
  kidney: "No kidney markers yet - creatinine or electrolytes map here.",
  blood: "No blood-count markers yet - a full blood count maps here.",
  inflammation: "No inflammation markers yet - CRP or ESR map here."
} satisfies Record<BodySystemZone, string>;

const zoneSides = {
  brain: "right",
  thyroid: "right",
  lungs: "right",
  liver: "right",
  inflammation: "right",
  cardio: "left",
  metabolic: "left",
  kidney: "left",
  blood: "left"
} satisfies Record<BodySystemZone, "left" | "right">;

interface ZoneLayout {
  zone: BodySystemZone;
  centers: Array<{ x: number; y: number }>;
  radius: { x: number; y: number };
}

const zoneLayouts: ZoneLayout[] = [
  { zone: "brain", centers: [{ x: 100, y: 26 }], radius: { x: 11, y: 13 } },
  { zone: "thyroid", centers: [{ x: 100, y: 58 }], radius: { x: 7, y: 4.5 } },
  { zone: "lungs", centers: [{ x: 83, y: 100 }, { x: 117, y: 100 }], radius: { x: 10, y: 14 } },
  { zone: "cardio", centers: [{ x: 96, y: 107 }], radius: { x: 8.5, y: 8.5 } },
  { zone: "liver", centers: [{ x: 112, y: 140 }], radius: { x: 12, y: 8 } },
  { zone: "metabolic", centers: [{ x: 87, y: 146 }], radius: { x: 8, y: 6 } },
  { zone: "kidney", centers: [{ x: 84, y: 170 }, { x: 116, y: 170 }], radius: { x: 6, y: 8.5 } },
  { zone: "blood", centers: [{ x: 100, y: 201 }], radius: { x: 11, y: 8 } },
  // Inflammation is a whole-body "rim" state rather than an organ: it gets a tap target and a
  // label, but no leader line, bloom, or marker dot.
  { zone: "inflammation", centers: [{ x: 146, y: 206 }], radius: { x: 9, y: 9 } }
];

function layoutFor(zone: BodySystemZone) {
  return zoneLayouts.find((layout) => layout.zone === zone);
}

function isRimZone(zone: BodySystemZone) {
  return zone === "inflammation";
}

const metricAliases: Array<{ zone: BodySystemZone; aliases: string[] }> = [
  { zone: "blood", aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"] },
  { zone: "blood", aliases: ["hematocrit", "haematocrit", "hct", "pcv"] },
  { zone: "blood", aliases: ["mean cell volume", "mean corpuscular volume", "red blood cell mean cell volume", "mcv"] },
  { zone: "blood", aliases: ["mean cell haemoglobin concentration", "mean cell haemoglobin", "mean cell hemoglobin", "mchc", "mch"] },
  { zone: "blood", aliases: ["platelet count", "platelets", "plt"] },
  { zone: "blood", aliases: ["red blood cell count", "red blood cells", "rbc"] },
  { zone: "blood", aliases: ["white blood cell count", "white blood cells", "white cell count", "wbc"] },
  { zone: "blood", aliases: ["neutrophil count", "neutrophils"] },
  { zone: "blood", aliases: ["lymphocyte count", "lymphocytes"] },
  { zone: "blood", aliases: ["monocyte count", "monocytes"] },
  { zone: "blood", aliases: ["eosinophil count", "eosinophils"] },
  { zone: "blood", aliases: ["basophil count", "basophils"] },
  { zone: "blood", aliases: ["ferritin"] },
  { zone: "blood", aliases: ["serum iron", "iron"] },
  { zone: "blood", aliases: ["total iron binding capacity", "tibc"] },
  { zone: "blood", aliases: ["transferrin saturation", "tsat"] },
  { zone: "blood", aliases: ["transferrin"] },
  { zone: "cardio", aliases: ["total cholesterol", "cholesterol total", "cholesterol"] },
  { zone: "cardio", aliases: ["ldl cholesterol", "ldl-c", "ldl"] },
  { zone: "cardio", aliases: ["hdl cholesterol", "hdl-c", "hdl"] },
  { zone: "cardio", aliases: ["total cholesterol / hdl cholesterol ratio", "total cholesterol/hdl", "chol/hdl ratio", "total / hdl ratio", "tc/hdl"] },
  { zone: "cardio", aliases: ["non hdl cholesterol", "non-hdl cholesterol", "non hdl"] },
  { zone: "cardio", aliases: ["triglycerides", "triglyceride"] },
  { zone: "cardio", aliases: ["apolipoprotein b", "apo b", "apob"] },
  { zone: "cardio", aliases: ["apolipoprotein a-i", "apolipoprotein a1", "apo a"] },
  { zone: "cardio", aliases: ["lipoprotein (a)", "lipoprotein a", "lp(a)"] },
  { zone: "inflammation", aliases: ["high sensitivity c-reactive protein (hscrp)", "high sensitivity c-reactive protein", "c-reactive protein", "hs-crp", "hscrp", "crp"] },
  { zone: "inflammation", aliases: ["erythrocyte sedimentation rate", "esr"] },
  { zone: "liver", aliases: ["alanine aminotransferase", "alanine transaminase", "alt", "sgpt"] },
  { zone: "liver", aliases: ["aspartate aminotransferase", "ast", "sgot"] },
  { zone: "liver", aliases: ["alkaline phosphatase", "alp"] },
  { zone: "liver", aliases: ["gamma-glutamyl transferase", "gamma gt", "ggt"] },
  { zone: "liver", aliases: ["total bilirubin", "bilirubin"] },
  { zone: "liver", aliases: ["bilirubin (direct)", "direct bilirubin", "conjugated bilirubin"] },
  { zone: "liver", aliases: ["albumin"] },
  { zone: "liver", aliases: ["total protein"] },
  { zone: "kidney", aliases: ["creatinine"] },
  { zone: "kidney", aliases: ["blood urea nitrogen", "urea", "bun"] },
  { zone: "kidney", aliases: ["estimated gfr", "egfr"] },
  { zone: "kidney", aliases: ["sodium", "na"] },
  { zone: "kidney", aliases: ["potassium", "k"] },
  { zone: "kidney", aliases: ["chloride"] },
  { zone: "kidney", aliases: ["uric acid", "urate"] },
  { zone: "metabolic", aliases: ["fasting blood sugar", "fasting glucose", "blood glucose", "blood sugar", "glucose", "fbs"] },
  { zone: "metabolic", aliases: ["glycated haemoglobin", "glycated hemoglobin", "hba1c"] },
  { zone: "metabolic", aliases: ["insulin"] },
  { zone: "metabolic", aliases: ["c-peptide", "c peptide"] },
  { zone: "thyroid", aliases: ["thyroid stimulating hormone", "tsh"] },
  { zone: "thyroid", aliases: ["free t4", "ft4", "thyroxine"] },
  { zone: "thyroid", aliases: ["free t3", "ft3"] },
  { zone: "brain", aliases: ["25-hydroxyvitamin d", "25-oh vitamin d", "vitamin d"] },
  { zone: "brain", aliases: ["vitamin b12", "cobalamin", "b12"] },
  { zone: "brain", aliases: ["folic acid", "folate"] }
];

const sortedAliases = metricAliases
  .flatMap((entry) => entry.aliases.map((alias) => ({ alias, zone: entry.zone })))
  .sort((a, b) => b.alias.length - a.alias.length);

/// The same humanoid silhouette iOS uses (`BodySilhouetteGeometry`), in the identical
/// 200x460 coordinate space: head, neck, torso, both arms, both legs.
const SILHOUETTE_SIZE = { width: 200, height: 460 };

const silhouettePath = [
  "M84 30a16 20 0 1 0 32 0a16 20 0 1 0 -32 0",
  "M91 46L109 46L111 66L89 66Z",
  "M61 82Q100 62 139 82C147 112 137 152 129 172Q138 198 131 218Q118 232 100 232Q82 232 69 218Q62 198 71 172C63 152 53 112 61 82Z",
  "M63 86C50 98 47 122 45 150L38 196Q35 210 43 213Q52 215 54 201L61 154C63 130 64 106 69 94Z",
  "M137 86C150 98 153 122 155 150L162 196Q165 210 157 213Q148 215 146 201L139 154C137 130 136 106 131 94Z",
  "M72 220C64 268 68 320 78 358L80 428Q80 444 89 444Q97 444 96 430L95 358C98 316 98 268 97 228Z",
  "M128 220C136 268 132 320 122 358L120 428Q120 444 111 444Q103 444 104 430L105 358C102 316 102 268 103 228Z"
].join(" ");

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export function zoneForMetricName(name: string): BodySystemZone | null {
  const normalized = name.toLowerCase();
  return sortedAliases.find((candidate) => normalized.includes(candidate.alias))?.zone ?? null;
}

function stateForFlag(flag: string | null | undefined): Exclude<BodyZoneState, "noData"> {
  const normalized = (flag ?? "").toLowerCase();
  if (normalized === "critical" || normalized === "abnormal") return "critical";
  if (normalized === "high" || normalized === "low" || normalized === "above_range" || normalized === "below_range") return "attention";
  return "normal";
}

function toneForZoneState(state: BodyZoneState): BioStatusTone {
  if (state === "critical") return "red";
  if (state === "attention") return "orange";
  if (state === "normal") return "green";
  return "gray";
}

function metricFromAttention(item: DashboardAttentionItem): BodyMetric | null {
  if (!item.display_name) return null;
  const state = stateForFlag(item.flag ?? item.reason_code);
  return {
    id: item.canonical_metric_id ?? item.id,
    name: item.display_name,
    value: item.value,
    unit: item.unit,
    statusTitle: state === "normal" ? "In range" : prettyStatus(item.flag ?? item.reason_code),
    state
  };
}

function metricFromTrend(preview: TrendPreview): BodyMetric {
  return {
    id: preview.canonical_metric_id,
    name: preview.display_name,
    value: preview.latest_value,
    unit: preview.unit,
    statusTitle: "In range",
    state: "normal"
  };
}

export function buildBodyMapSnapshot(dashboard: DashboardResponse | null | undefined): BodyZoneSnapshot[] {
  const metricsByZone = new Map<BodySystemZone, BodyMetric[]>();

  for (const item of dashboard?.needs_attention ?? []) {
    const metric = metricFromAttention(item);
    const zone = metric ? zoneForMetricName(metric.name) : null;
    if (zone && metric) {
      metricsByZone.set(zone, [...(metricsByZone.get(zone) ?? []), metric]);
    }
  }

  for (const preview of dashboard?.trend_previews ?? []) {
    const zone = zoneForMetricName(preview.display_name);
    if (zone && !(metricsByZone.get(zone) ?? []).length) {
      metricsByZone.set(zone, [metricFromTrend(preview)]);
    }
  }

  return zoneLayouts.map(({ zone }) => {
    const metrics = metricsByZone.get(zone) ?? [];
    const primaryMetric = metrics.find((metric) => metric.state === "critical")
      ?? metrics.find((metric) => metric.state === "attention")
      ?? metrics[0]
      ?? null;
    return {
      zone,
      state: primaryMetric?.state ?? "noData",
      primaryMetric,
      metricCount: metrics.length
    };
  });
}

// ---------------------------------------------------------------------------
// Particle field — port of iOS `BodyParticleFieldBuilder`
// ---------------------------------------------------------------------------

interface AmbientDot {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  usesSecondaryColor: boolean;
  group: number;
}

interface StatusDot {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  isTwinkle: boolean;
  twinkleDuration: number;
  twinklePhase: number;
}

interface ZoneVisual {
  zone: BodySystemZone;
  tone: BioStatusTone;
  dots: StatusDot[];
}

interface ParticleField {
  ambient: AmbientDot[];
  zones: ZoneVisual[];
  isDim: boolean;
}

const EMPTY_FIELD: ParticleField = { ambient: [], zones: [], isDim: true };

/// (dx, dy, drift period, opacity period) for the 3 independently-drifting ambient layers —
/// the same values iOS uses in `bodyDriftGroups`.
const driftGroups = [
  { dx: 3.2, dy: -4.2, driftPeriod: 6.5, opacityPeriod: 5.3 },
  { dx: -3.6, dy: 2.9, driftPeriod: 8.2, opacityPeriod: 7.1 },
  { dx: 2.6, dy: 4.0, driftPeriod: 9.7, opacityPeriod: 8.6 }
];

/// Raised-cosine 0 -> 1 -> 0 easing over `period` seconds, matching iOS `bodyPulse`.
function pulse(t: number, period: number) {
  if (period <= 0) return 0;
  return (1 - Math.cos((2 * Math.PI * t) / period)) / 2;
}

/// Seeded Lehmer/Park-Miller LCG — the same constants iOS uses, so the ambient texture is
/// stable across re-renders instead of reshuffling on every paint.
function makeRandom(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildParticleField(
  zones: BodyZoneSnapshot[],
  contains: (x: number, y: number) => boolean,
  ambientCount = 1100
): ParticleField {
  const rnd = makeRandom(7);
  const stateFor = (zone: BodySystemZone) => zones.find((item) => item.zone === zone)?.state ?? "noData";

  const flaggedHit = (x: number, y: number): ZoneLayout | null => {
    for (const layout of zoneLayouts) {
      if (isRimZone(layout.zone)) continue;
      const state = stateFor(layout.zone);
      if (state !== "attention" && state !== "critical") continue;
      for (const center of layout.centers) {
        const dx = (x - center.x) / layout.radius.x;
        const dy = (y - center.y) / layout.radius.y;
        if (dx * dx + dy * dy <= 1) return layout;
      }
    }
    return null;
  };

  const isDim = zones.every((zone) => zone.state === "noData");

  const ambient: AmbientDot[] = [];
  const incidental = new Map<BodySystemZone, StatusDot[]>();
  let n = 0;
  let tries = 0;
  while (n < ambientCount && tries < 45000) {
    tries += 1;
    const x = rnd() * SILHOUETTE_SIZE.width;
    const y = rnd() * SILHOUETTE_SIZE.height;
    if (!contains(x, y)) continue;
    n += 1;
    const radius = 0.7 + rnd() * 1.0;
    const hit = flaggedHit(x, y);
    if (hit) {
      const dots = incidental.get(hit.zone) ?? [];
      dots.push({ x, y, radius, baseOpacity: 0.5 + rnd() * 0.5, isTwinkle: false, twinkleDuration: 0, twinklePhase: 0 });
      incidental.set(hit.zone, dots);
      continue;
    }
    const opacity = 0.16 + rnd() * (isDim ? 0.28 : 0.5);
    ambient.push({ x, y, radius, baseOpacity: opacity, usesSecondaryColor: rnd() < 0.5, group: n % 3 });
  }

  const zoneVisuals: ZoneVisual[] = [];
  for (const layout of zoneLayouts) {
    if (isRimZone(layout.zone)) continue;
    const state = stateFor(layout.zone);
    if (state !== "attention" && state !== "critical") continue;
    const tone: BioStatusTone = state === "critical" ? "red" : "orange";

    const dots = incidental.get(layout.zone) ?? [];
    for (const center of layout.centers) {
      let added = 0;
      let attempts = 0;
      while (added < 55 && attempts < 3000) {
        attempts += 1;
        const x = center.x + (rnd() * 2 - 1) * layout.radius.x;
        const y = center.y + (rnd() * 2 - 1) * layout.radius.y;
        const dx = (x - center.x) / layout.radius.x;
        const dy = (y - center.y) / layout.radius.y;
        if (dx * dx + dy * dy > 1 || !contains(x, y)) continue;
        added += 1;
        const isTwinkle = rnd() < 0.1;
        const radius = (isTwinkle ? 1.2 : 0.7) + rnd() * 1.2;
        dots.push({
          x,
          y,
          radius,
          baseOpacity: 0.55 + rnd() * 0.45,
          isTwinkle,
          twinkleDuration: 1.6 + rnd() * 2.0,
          twinklePhase: rnd()
        });
      }
    }
    zoneVisuals.push({ zone: layout.zone, tone, dots });
  }

  return { ambient, zones: zoneVisuals, isDim };
}

// ---------------------------------------------------------------------------
// Stage layout — port of iOS `BodyVisualizationLayout`
// ---------------------------------------------------------------------------

interface PillMetrics {
  height: number;
  fontSize: number;
  iconSize: number;
  cornerRadius: number;
  minWidth: number;
  gap: number;
  paddingX: number;
  /// Everything in the pill that is not the title: both borders, both paddings, the icon
  /// badge, and the icon/text gap.
  chromeWidth: number;
}

interface StageLayout {
  stageWidth: number;
  stageHeight: number;
  figure: { x: number; y: number; width: number; height: number };
  sideRailWidth: number;
  minimumPillSpacing: number;
  pill: PillMetrics;
}

const FOOTER_RESERVE = 34;

/// Past a phone-sized stage the labels would drift toward the window edges, stretching the
/// connector lines until the composition reads as disconnected. Rails stop growing here and
/// the figure takes the rest of the width instead.
const MAX_RAIL_WIDTH = 176;

/// iOS's `BodyPillMetrics`, kept exactly at phone sizes. Wider stages scale the whole pill up
/// together so it stays proportional to a much larger figure.
function pillMetricsFor(stageWidth: number): PillMetrics {
  const scale = stageWidth >= 900 ? 1.18 : 1;
  const iconSize = Math.round(18 * scale);
  const gap = Math.round(5 * scale);
  const paddingX = Math.round(6 * scale);
  return {
    height: Math.round(42 * scale),
    fontSize: Math.round(13 * scale * 100) / 100,
    iconSize,
    cornerRadius: Math.round(14 * scale),
    minWidth: Math.round(78 * scale),
    gap,
    paddingX,
    chromeWidth: 2 + paddingX * 2 + iconSize + gap
  };
}

function buildStageLayout(stageWidth: number, stageHeight: number): StageLayout {
  const aspect = SILHOUETTE_SIZE.width / SILHOUETTE_SIZE.height;
  // Scale with the available width while preserving readable side rails for the category
  // labels: compact widths keep the labels usable, wide ones let the body grow.
  const labelRailFloor = stageWidth < 340 ? 64 : stageWidth < 380 ? 72 : 80;
  const availableFigureHeight = Math.max(1, stageHeight - FOOTER_RESERVE);
  // Phones stay on iOS's 0.58 share. Wider stages are height-bound rather than width-bound, so
  // letting the figure claim more of the row is what actually makes it fill the space.
  const widthShare = stageWidth >= 900 ? 0.72 : 0.58;
  const width = Math.min(
    stageWidth * widthShare,
    Math.max(150, stageWidth - labelRailFloor * 2),
    availableFigureHeight * aspect
  );
  const height = width / aspect;
  const contentHeight = height + FOOTER_RESERVE;
  const figure = {
    x: (stageWidth - width) / 2,
    y: Math.max(0, (stageHeight - contentHeight) / 2),
    width,
    height
  };
  const scale = height / SILHOUETTE_SIZE.height;
  const pill = pillMetricsFor(stageWidth);
  return {
    stageWidth,
    stageHeight,
    figure,
    sideRailWidth: Math.max(0, Math.min(figure.x, MAX_RAIL_WIDTH)),
    // Measured on screen rather than only in silhouette coordinates, so two adjacent labels
    // never collide once the figure is scaled down.
    minimumPillSpacing: Math.max(96, 88 / Math.max(scale, 0.01)),
    pill
  };
}

function projectPoint(layout: StageLayout, x: number, y: number) {
  return {
    x: layout.figure.x + (x / SILHOUETTE_SIZE.width) * layout.figure.width,
    y: layout.figure.y + (y / SILHOUETTE_SIZE.height) * layout.figure.height
  };
}

/// A shallow floor keeps every name's size close together - only the two longest
/// ("Cardiovascular", "Brain & Nerves") ever approach it.
const PILL_MIN_SCALE = 0.6;

function maximumPillWidth(layout: StageLayout, borrowedWidth: number) {
  return Math.max(layout.pill.minWidth + 14, layout.sideRailWidth + borrowedWidth - 2);
}

function pillRailCenterX(layout: StageLayout, side: "left" | "right") {
  return side === "left"
    ? layout.figure.x - layout.sideRailWidth / 2
    : layout.figure.x + layout.figure.width + layout.sideRailWidth / 2;
}

/// Per-zone nudges iOS applies so cardio clears the shoulder line and inflammation sits below
/// the torso rather than on it.
function pillScreenYOffset(zone: BodySystemZone) {
  if (zone === "cardio") return -68;
  if (zone === "inflammation") return 18;
  return 0;
}

/// How much of the figure's own lane a long label is allowed to borrow.
function pillRailBorrow(zone: BodySystemZone) {
  if (zone === "brain") return 28;
  if (zone === "inflammation") return 24;
  if (zone === "cardio") return 44;
  return 0;
}

interface PillInfo {
  zone: BodySystemZone;
  side: "left" | "right";
  y: number;
  state: BodyZoneState;
  metricCount: number;
  title: string;
  tone: BioStatusTone;
}

/// Every labelled zone is always shown — including ones with no readings yet, tinted neutral
/// grey — so "no data" is communicated rather than the zone silently disappearing. Lungs is the
/// one exception: no metric in the catalog maps to it, so it would sit permanently grey.
function buildPillLayout(zones: BodyZoneSnapshot[], minimumSpacing: number): PillInfo[] {
  const entries = zoneLayouts
    .filter((layout) => layout.zone !== "lungs")
    .map((layout) => {
      const snapshot = zones.find((zone) => zone.zone === layout.zone);
      return {
        zone: layout.zone,
        side: zoneSides[layout.zone],
        anchorY: layout.zone === "inflammation" ? 205 : layout.centers[0].y,
        state: snapshot?.state ?? ("noData" as BodyZoneState),
        metricCount: snapshot?.metricCount ?? 0
      };
    });

  const result: PillInfo[] = [];
  for (const side of ["left", "right"] as const) {
    let lastY = -99;
    for (const entry of entries.filter((item) => item.side === side).sort((a, b) => a.anchorY - b.anchorY)) {
      const y = Math.max(entry.anchorY, lastY + minimumSpacing);
      lastY = y;
      result.push({
        zone: entry.zone,
        side: entry.side,
        y,
        state: entry.state,
        metricCount: entry.metricCount,
        title: zoneDisplayNames[entry.zone],
        tone: toneForZoneState(entry.state)
      });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Colors — iOS light-mode values (`Theme` / `BioStatusTone`)
// ---------------------------------------------------------------------------

const toneRgb: Record<BioStatusTone, [number, number, number]> = {
  green: [52, 199, 89],
  orange: [255, 149, 0],
  red: [249, 115, 22],
  gray: [71, 85, 105],
  blue: [37, 99, 235],
  yellow: [255, 204, 0],
  brand: [17, 94, 89]
};

function rgba(tone: BioStatusTone, alpha: number) {
  const [r, g, b] = toneRgb[tone];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const AMBIENT_PRIMARY = [13, 148, 136] as const; // teal600
const AMBIENT_SECONDARY = [37, 99, 235] as const; // blue
const HALO_COLOR = [15, 118, 110] as const; // teal700
const TWINKLE_COLOR = [255, 233, 179] as const; // 0xffe9b3

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BodyVisualization({
  dashboard,
  memberName,
  isLoading = false,
  onSelectZone
}: {
  dashboard: DashboardResponse | null | undefined;
  memberName: string;
  isLoading?: boolean;
  onSelectZone?: (zone: BodySystemZone) => void;
}) {
  const zones = useMemo(() => buildBodyMapSnapshot(dashboard), [dashboard]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const figureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const linesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [field, setField] = useState<ParticleField>(EMPTY_FIELD);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pillFontSizes, setPillFontSizes] = useState<Record<string, number>>({});

  const path = useMemo(() => (typeof Path2D === "undefined" ? null : new Path2D(silhouettePath)), []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Measured synchronously before the first paint so the figure is laid out on the very first
  // frame, then kept in sync by the observer as the viewport changes.
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setStageSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Sampling the silhouette needs a real 2D context for hit-testing, so the field is built in
  // an effect rather than during render.
  useEffect(() => {
    if (!path) return;
    const scratch = document.createElement("canvas");
    scratch.width = SILHOUETTE_SIZE.width;
    scratch.height = SILHOUETTE_SIZE.height;
    const ctx = scratch.getContext("2d");
    if (!ctx) return;
    setField(buildParticleField(zones, (x, y) => ctx.isPointInPath(path, x, y)));
  }, [zones, path]);

  const layout = useMemo(
    () => (stageSize.width > 0 && stageSize.height > 0 ? buildStageLayout(stageSize.width, stageSize.height) : null),
    [stageSize.width, stageSize.height]
  );

  const pills = useMemo(
    () => (layout ? buildPillLayout(zones, layout.minimumPillSpacing) : []),
    [zones, layout]
  );

  // Long names shrink to fit rather than truncating, matching iOS's
  // `.minimumScaleFactor(0.6)` on the pill title. The intrinsic width is taken from an
  // unconstrained ruler node rather than the title itself, whose `scrollWidth` reports the
  // already-ellipsised width once it overflows.
  useEffect(() => {
    if (!layout || pills.length === 0) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const sample = stageRef.current?.querySelector<HTMLElement>(".body-zone-pill-title");
      if (!sample) return;

      const style = getComputedStyle(sample);
      const ruler = document.createElement("span");
      ruler.style.cssText = [
        "position:absolute",
        "top:0",
        "left:-9999px",
        "visibility:hidden",
        "white-space:nowrap",
        `font-family:${style.fontFamily}`,
        `font-weight:${style.fontWeight}`,
        `font-style:${style.fontStyle}`,
        `letter-spacing:${style.letterSpacing}`,
        `font-size:${layout.pill.fontSize}px`
      ].join(";");
      document.body.appendChild(ruler);

      const next: Record<string, number> = {};
      for (const pill of pills) {
        const borrowed = pillRailBorrow(pill.zone);
        // The pill can never outgrow its own rail, so the rail caps it even when
        // `maximumPillWidth`'s floor is wider.
        const cap = Math.min(maximumPillWidth(layout, borrowed), layout.sideRailWidth + borrowed);
        const available = cap - layout.pill.chromeWidth;
        ruler.textContent = pill.title;
        const intrinsic = ruler.getBoundingClientRect().width;
        const ratio = intrinsic > 0 ? available / intrinsic : 1;
        next[pill.zone] = Math.floor(layout.pill.fontSize * Math.min(1, Math.max(ratio, PILL_MIN_SCALE)) * 100) / 100;
      }
      ruler.remove();

      setPillFontSizes((current) => (pills.every((pill) => current[pill.zone] === next[pill.zone]) ? current : next));
    };

    // Measure now for the first paint, then again once webfonts settle: `fonts.status` reads
    // "loaded" before a swap-in face has been requested, and Inter is wider than the fallback,
    // so a single early pass leaves the longest names clipped.
    measure();
    void document.fonts?.ready.then(measure);
    document.fonts?.addEventListener("loadingdone", measure);
    return () => {
      cancelled = true;
      document.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [pills, layout]);

  // ---- Figure canvas (halo + blooms + ambient drift + status dots) ----
  const drawFigure = useCallback(
    (time: number) => {
      const canvas = figureCanvasRef.current;
      if (!canvas || !layout || !path) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = layout.figure;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      const scale = width / SILHOUETTE_SIZE.width;
      const scaleY = height / SILHOUETTE_SIZE.height;
      const project = (x: number, y: number) => ({ x: x * scale, y: y * scaleY });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const breathe = 1 + 0.022 * pulse(time, 4.6);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(breathe, breathe);
      ctx.translate(-width / 2, -height / 2);

      // Halo: a blurred fill of the silhouette. There is deliberately no outline stroke —
      // the figure reads as a particle field, not a drawn body.
      ctx.save();
      ctx.filter = "blur(10px)";
      ctx.fillStyle = `rgba(${HALO_COLOR[0]}, ${HALO_COLOR[1]}, ${HALO_COLOR[2]}, ${field.isDim ? 0.05 : 0.1})`;
      ctx.save();
      ctx.scale(scale, scaleY);
      ctx.fill(path);
      ctx.restore();
      ctx.restore();

      // Blooms behind each flagged zone.
      field.zones.forEach((zone, index) => {
        const zoneLayout = layoutFor(zone.zone);
        if (!zoneLayout) return;
        const period = 2.8 + index * 0.3;
        const factor = 0.5 + 0.5 * pulse(time, period);
        const rx = (zoneLayout.radius.x + 10) * scale;
        const ry = (zoneLayout.radius.y + 10) * scaleY;
        for (const center of zoneLayout.centers) {
          const point = project(center.x, center.y);
          const end = Math.max(rx, ry);
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, end);
          gradient.addColorStop(0, rgba(zone.tone, 0.3 * factor));
          gradient.addColorStop(1, rgba(zone.tone, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(point.x, point.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Ambient field — three layers drifting and breathing independently.
      for (const dot of field.ambient) {
        const group = driftGroups[dot.group];
        const driftFactor = pulse(time, group.driftPeriod);
        const opacityFactor = 1 - 0.32 * pulse(time, group.opacityPeriod);
        const point = project(dot.x + group.dx * driftFactor, dot.y + group.dy * driftFactor);
        const [r, g, b] = dot.usesSecondaryColor ? AMBIENT_SECONDARY : AMBIENT_PRIMARY;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.baseOpacity * opacityFactor})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, dot.radius * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dense status dots inside flagged zones, with occasional warm twinkles.
      for (const zone of field.zones) {
        for (const dot of zone.dots) {
          let opacity = dot.baseOpacity;
          if (dot.isTwinkle) {
            const factor = pulse(time + dot.twinklePhase * dot.twinkleDuration, dot.twinkleDuration);
            opacity = dot.baseOpacity - (dot.baseOpacity - 0.15) * factor;
          }
          const point = project(dot.x, dot.y);
          ctx.fillStyle = dot.isTwinkle
            ? `rgba(${TWINKLE_COLOR[0]}, ${TWINKLE_COLOR[1]}, ${TWINKLE_COLOR[2]}, ${opacity})`
            : rgba(zone.tone, opacity);
          ctx.beginPath();
          ctx.arc(point.x, point.y, dot.radius * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Solid marker for in-range zones that do have data.
      for (const zoneLayout of zoneLayouts) {
        if (isRimZone(zoneLayout.zone)) continue;
        if (zones.find((zone) => zone.zone === zoneLayout.zone)?.state !== "normal") continue;
        for (const center of zoneLayout.centers) {
          const point = project(center.x, center.y);
          ctx.fillStyle = rgba("green", 1);
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.filter = "blur(3px)";
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Quiet neutral marker for zones with no readings yet, matching the grey label at the
      // end of their connector line.
      for (const zoneLayout of zoneLayouts) {
        if (isRimZone(zoneLayout.zone) || zoneLayout.zone === "lungs") continue;
        if (zones.find((zone) => zone.zone === zoneLayout.zone)?.state !== "noData") continue;
        for (const center of zoneLayout.centers) {
          const point = project(center.x, center.y);
          ctx.fillStyle = rgba("gray", 0.45);
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
    [field, layout, path, zones]
  );

  useEffect(() => {
    if (!layout) return;
    if (reduceMotion) {
      drawFigure(0);
      return;
    }
    let frame = 0;
    const loop = () => {
      drawFigure(performance.now() / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [drawFigure, layout, reduceMotion]);

  // ---- Leader lines ----
  useEffect(() => {
    const canvas = linesCanvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(layout.stageWidth * dpr);
    canvas.height = Math.round(layout.stageHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, layout.stageWidth, layout.stageHeight);

    for (const pill of pills) {
      if (isRimZone(pill.zone)) continue;
      const zoneLayout = layoutFor(pill.zone);
      if (!zoneLayout) continue;
      const center = pill.side === "left" ? zoneLayout.centers[0] : zoneLayout.centers[zoneLayout.centers.length - 1];
      const borrowedWidth = pillRailBorrow(pill.zone);
      const labelY = projectPoint(layout, 0, pill.y).y + pillScreenYOffset(pill.zone);
      const figureMaxX = layout.figure.x + layout.figure.width;
      const railX = pill.side === "left" ? layout.figure.x + borrowedWidth - 6 : figureMaxX - borrowedWidth + 6;
      const nubX = pill.side === "left" ? layout.figure.x + 5 : figureMaxX - 5;
      const edgeX = pill.side === "left" ? center.x - zoneLayout.radius.x - 3 : center.x + zoneLayout.radius.x + 3;
      const organ = projectPoint(layout, edgeX, center.y);

      ctx.strokeStyle = rgba(pill.tone, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(railX, labelY);
      ctx.lineTo(nubX, labelY);
      ctx.lineTo(organ.x, organ.y);
      ctx.stroke();

      ctx.fillStyle = rgba(pill.tone, 0.4);
      ctx.beginPath();
      ctx.arc(organ.x, organ.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [pills, layout]);

  const figureStyle = layout
    ? { left: `${layout.figure.x}px`, top: `${layout.figure.y}px`, width: `${layout.figure.width}px`, height: `${layout.figure.height}px` }
    : undefined;

  return (
    <div className="body-stage" ref={stageRef}>
      {layout ? (
        <>
          <canvas aria-hidden="true" className="body-stage-figure" ref={figureCanvasRef} style={figureStyle} />
          <canvas aria-hidden="true" className="body-stage-lines" ref={linesCanvasRef} />

          {zoneLayouts.flatMap((zoneLayout) =>
            zoneLayout.centers.map((center, index) => {
              const snapshot = zones.find((zone) => zone.zone === zoneLayout.zone);
              const point = projectPoint(layout, center.x, center.y);
              const hitWidth = Math.max((zoneLayout.radius.x * 2 * layout.figure.width) / SILHOUETTE_SIZE.width, 44);
              const hitHeight = Math.max((zoneLayout.radius.y * 2 * layout.figure.height) / SILHOUETTE_SIZE.height, 44);
              const style = {
                left: `${point.x - hitWidth / 2}px`,
                top: `${point.y - hitHeight / 2}px`,
                width: `${hitWidth}px`,
                height: `${hitHeight}px`
              };
              const label = zoneDisplayNames[zoneLayout.zone];
              const hint = snapshot?.primaryMetric
                ? `${snapshot.primaryMetric.statusTitle}. Open trend.`
                : bodyZoneNoDataSummary[zoneLayout.zone];
              return onSelectZone ? (
                <button
                  aria-label={`${label}. ${hint}`}
                  className="body-zone-hit"
                  key={`${zoneLayout.zone}-${index}`}
                  onClick={() => onSelectZone(zoneLayout.zone)}
                  style={style}
                  type="button"
                />
              ) : snapshot?.primaryMetric ? (
                <Link
                  aria-label={`${label}. ${hint}`}
                  className="body-zone-hit"
                  href={`/app/trends/${snapshot.primaryMetric.id}`}
                  key={`${zoneLayout.zone}-${index}`}
                  style={style}
                />
              ) : (
                <span aria-hidden="true" className="body-zone-hit is-inert" key={`${zoneLayout.zone}-${index}`} style={style} />
              );
            })
          )}

          {pills.map((pill) => {
            const borrowedWidth = pillRailBorrow(pill.zone);
            const railWidth = layout.sideRailWidth + borrowedWidth;
            const centerX = pillRailCenterX(layout, pill.side) + (pill.side === "left" ? borrowedWidth / 2 : -borrowedWidth / 2);
            const centerY = projectPoint(layout, 0, pill.y).y + pillScreenYOffset(pill.zone);
            const snapshot = zones.find((zone) => zone.zone === pill.zone);
            const label = pill.state === "noData"
              ? `${pill.title}, no readings yet`
              : `${pill.title}, ${statusWord(pill.state)}, ${pill.metricCount} ${pill.metricCount === 1 ? "reading" : "readings"}`;
            const content = (
              <>
                <span className={`body-zone-pill-icon ${toneClass(pill.tone)}`}>
                  <BioIcon name={zoneIcons[pill.zone]} size={Math.round(layout.pill.iconSize * 0.54)} />
                </span>
                <span className="body-zone-pill-title" data-zone={pill.zone} style={{ fontSize: `${pillFontSizes[pill.zone] ?? layout.pill.fontSize}px` }}>
                  {pill.title}
                </span>
              </>
            );
            return (
              <div
                className={`body-zone-pill-rail is-${pill.side}`}
                key={pill.zone}
                style={{
                  left: `${centerX - railWidth / 2}px`,
                  top: `${centerY - layout.pill.height / 2}px`,
                  width: `${railWidth}px`,
                  height: `${layout.pill.height}px`,
                  ["--body-pill-max" as string]: `${maximumPillWidth(layout, borrowedWidth)}px`,
                  ["--body-pill-height" as string]: `${layout.pill.height}px`,
                  ["--body-pill-radius" as string]: `${layout.pill.cornerRadius}px`,
                  ["--body-pill-min" as string]: `${layout.pill.minWidth}px`,
                  ["--body-pill-gap" as string]: `${layout.pill.gap}px`,
                  ["--body-pill-padding" as string]: `${layout.pill.paddingX}px`,
                  ["--body-pill-icon" as string]: `${layout.pill.iconSize}px`
                }}
              >
                {onSelectZone ? (
                  <button aria-label={label} className={`body-zone-pill ${toneClass(pill.tone)}`} onClick={() => onSelectZone(pill.zone)} type="button">
                    {content}
                  </button>
                ) : snapshot?.primaryMetric ? (
                  <Link aria-label={label} className={`body-zone-pill ${toneClass(pill.tone)}`} href={`/app/trends/${snapshot.primaryMetric.id}`}>
                    {content}
                  </Link>
                ) : (
                  <span aria-label={label} className={`body-zone-pill ${toneClass(pill.tone)} is-inert`} role="img">
                    {content}
                  </span>
                )}
              </div>
            );
          })}

          <strong
            className="body-stage-name"
            style={{ left: `${layout.figure.x + layout.figure.width / 2}px`, top: `${layout.figure.y + layout.figure.height + 14}px` }}
          >
            {memberName}
          </strong>
        </>
      ) : null}

      {isLoading ? (
        <span className="body-stage-loading">
          <span className="body-stage-spinner" />
          Loading {memberName}
        </span>
      ) : null}
    </div>
  );
}

function statusWord(state: BodyZoneState) {
  if (state === "critical") return "critical";
  if (state === "attention") return "attention";
  if (state === "normal") return "normal";
  return "no readings yet";
}

// ---------------------------------------------------------------------------
// Tiles mode — port of iOS `BodyTilesView` / `BodyZoneTile`
// ---------------------------------------------------------------------------

export function BodyZoneTiles({ dashboard, onSelectZone }: { dashboard: DashboardResponse | null | undefined; onSelectZone?: (zone: BodySystemZone) => void }) {
  const zones = useMemo(() => buildBodyMapSnapshot(dashboard), [dashboard]);
  const ordered = useMemo(
    () =>
      zones
        .slice()
        .sort(
          (a, b) =>
            severityRank(a.state) - severityRank(b.state) ||
            zoneDisplayNames[a.zone].localeCompare(zoneDisplayNames[b.zone])
        ),
    [zones]
  );

  return (
    <div className="body-tiles-grid">
      {ordered.map((zone) => {
        const tone = toneForZoneState(zone.state);
        const content = (
          <>
            <span className="body-zone-tile-head">
              <span className="body-zone-tile-title">{zoneDisplayNames[zone.zone]}</span>
              <span className="body-zone-tile-dot" />
            </span>
            <span className="body-zone-tile-subtitle">{zone.primaryMetric?.name ?? bodyZoneNoDataSummary[zone.zone]}</span>
            <span className="body-zone-tile-status">{statusLabel(zone.state)}</span>
          </>
        );
        return onSelectZone ? (
          <button className={`body-zone-tile ${toneClass(tone)}`} key={zone.zone} onClick={() => onSelectZone(zone.zone)} type="button">
            {content}
          </button>
        ) : zone.primaryMetric ? (
          <Link className={`body-zone-tile ${toneClass(tone)}`} href={`/app/trends/${zone.primaryMetric.id}`} key={zone.zone}>
            {content}
          </Link>
        ) : (
          <article className={`body-zone-tile ${toneClass(tone)} is-inert`} key={zone.zone}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

function statusLabel(state: BodyZoneState) {
  if (state === "noData") return "No data";
  if (state === "normal") return "In range";
  if (state === "attention") return "Needs attention";
  return "Critical";
}

function severityRank(state: BodyZoneState) {
  if (state === "critical") return 0;
  if (state === "attention") return 1;
  if (state === "normal") return 2;
  return 3;
}
