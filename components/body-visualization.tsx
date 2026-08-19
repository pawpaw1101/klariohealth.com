"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { DashboardAttentionItem, DashboardResponse, TrendPreview } from "@/lib/api/types";
import { toneClass, type BioStatusTone } from "@/lib/tone";
import { prettyStatus } from "@/components/workspaces/shared";

type BodySystemZone = "brain" | "thyroid" | "lungs" | "cardio" | "liver" | "metabolic" | "kidney" | "blood" | "inflammation";
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
}

const zoneDisplayNames = {
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

const zoneLayouts = [
  { zone: "brain", centers: [{ x: 100, y: 26 }], radius: { x: 11, y: 13 } },
  { zone: "thyroid", centers: [{ x: 100, y: 58 }], radius: { x: 7, y: 4.5 } },
  { zone: "lungs", centers: [{ x: 83, y: 100 }, { x: 117, y: 100 }], radius: { x: 10, y: 14 } },
  { zone: "cardio", centers: [{ x: 96, y: 107 }], radius: { x: 8.5, y: 8.5 } },
  { zone: "liver", centers: [{ x: 112, y: 140 }], radius: { x: 12, y: 8 } },
  { zone: "metabolic", centers: [{ x: 87, y: 146 }], radius: { x: 8, y: 6 } },
  { zone: "kidney", centers: [{ x: 84, y: 170 }, { x: 116, y: 170 }], radius: { x: 6, y: 8.5 } },
  { zone: "blood", centers: [{ x: 100, y: 201 }], radius: { x: 11, y: 8 } },
  { zone: "inflammation", centers: [{ x: 146, y: 206 }], radius: { x: 9, y: 9 } }
] satisfies Array<{ zone: BodySystemZone; centers: Array<{ x: number; y: number }>; radius: { x: number; y: number } }>;

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

const silhouettePath = [
  "M84 30a16 20 0 1 0 32 0a16 20 0 1 0 -32 0",
  "M91 46L109 46L111 66L89 66Z",
  "M61 82Q100 62 139 82C147 112 137 152 129 172Q138 198 131 218Q118 232 100 232Q82 232 69 218Q62 198 71 172C63 152 53 112 61 82Z",
  "M63 86C50 98 47 122 45 150L38 196Q35 210 43 213Q52 215 54 201L61 154C63 130 64 106 69 94Z",
  "M137 86C150 98 153 122 155 150L162 196Q165 210 157 213Q148 215 146 201L139 154C137 130 136 106 131 94Z",
  "M72 220C64 268 68 320 78 358L80 428Q80 444 89 444Q97 444 96 430L95 358C98 316 98 268 97 228Z",
  "M128 220C136 268 132 320 122 358L120 428Q120 444 111 444Q103 444 104 430L105 358C102 316 102 268 103 228Z"
].join(" ");

function zoneForMetricName(name: string): BodySystemZone | null {
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
      primaryMetric
    };
  });
}

function ambientParticles() {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 420 }, (_, index) => {
    const band = index % 5;
    const x = 58 + rnd() * 84;
    const y = band === 0 ? 16 + rnd() * 42 : band === 1 ? 72 + rnd() * 74 : band === 2 ? 128 + rnd() * 92 : 220 + rnd() * 210;
    return { x, y, r: 0.45 + rnd() * 0.9, group: index % 3 };
  });
}

export function BodyVisualization({
  dashboard,
  memberName
}: {
  dashboard: DashboardResponse | null | undefined;
  memberName: string;
}) {
  const zones = useMemo(() => buildBodyMapSnapshot(dashboard), [dashboard]);
  const particles = useMemo(() => ambientParticles(), []);
  const labelledZones = zones.filter((zone) => zone.state !== "noData");

  return (
    <div className="body-visualization">
      <div className="body-visualization-stage">
        <svg className="body-map-svg" viewBox="0 0 360 500" role="img" aria-label={`Body map for ${memberName}`}>
          <defs>
            <filter id="body-map-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="body-map-clip">
              <path d={silhouettePath} />
            </clipPath>
          </defs>
          <g transform="translate(80 18)">
            <path className="body-silhouette" d={silhouettePath} />
            <g clipPath="url(#body-map-clip)">
                {particles.map((particle, index) => (
                  <circle className={`body-particle is-group-${particle.group}`} key={`${particle.x}-${index}`} cx={particle.x} cy={particle.y} r={particle.r} />
                ))}
            </g>
            {zoneLayouts.map((layout) => {
              const zone = zones.find((item) => item.zone === layout.zone)!;
              const tone = toneForZoneState(zone.state);
              const isRim = layout.zone === "inflammation";
              return (
                <g className={`body-zone tone-${tone}`} key={layout.zone}>
                  {isRim && zone.state !== "noData" ? <path className="body-inflammation-rim" d={silhouettePath} /> : null}
                  {!isRim ? layout.centers.map((center, index) => (
                    <g key={`${layout.zone}-${index}`}>
                      {zone.state === "attention" || zone.state === "critical" ? <ellipse className="body-zone-bloom" cx={center.x} cy={center.y} rx={layout.radius.x + 11} ry={layout.radius.y + 11} /> : null}
                      {zone.state !== "noData" ? <circle className="body-zone-dot" cx={center.x} cy={center.y} r={zone.state === "normal" ? 3 : 4.5} /> : null}
                      {zone.primaryMetric ? (
                        <a href={`/app/trends/${zone.primaryMetric.id}`} aria-label={`Open ${zoneDisplayNames[zone.zone]} trend`}>
                          <ellipse className="body-zone-hit" cx={center.x} cy={center.y} rx={Math.max(layout.radius.x + 18, 22)} ry={Math.max(layout.radius.y + 18, 22)} />
                        </a>
                      ) : (
                        <ellipse className="body-zone-hit" cx={center.x} cy={center.y} rx={Math.max(layout.radius.x + 18, 22)} ry={Math.max(layout.radius.y + 18, 22)} />
                      )}
                    </g>
                  )) : null}
                </g>
              );
            })}
          </g>
          {labelledZones.map((zone) => {
            const layout = zoneLayouts.find((item) => item.zone === zone.zone)!;
            const side = zoneSides[zone.zone];
            const anchor = layout.centers[0];
            const labelX = side === "left" ? 26 : 252;
            const sourceX = 80 + anchor.x + (side === "left" ? -layout.radius.x - 4 : layout.radius.x + 4);
            const sourceY = 18 + (zone.zone === "inflammation" ? 206 : anchor.y);
            const labelY = Math.max(26, Math.min(444, 18 + (zone.zone === "inflammation" ? 206 : anchor.y)));
            return (
              <g className={`body-label-line ${toneClass(toneForZoneState(zone.state))}`} key={zone.zone}>
                {zone.zone !== "inflammation" ? <path d={`M${sourceX} ${sourceY} L${side === "left" ? 112 : 248} ${labelY} L${labelX + (side === "left" ? 80 : 0)} ${labelY}`} /> : null}
                <foreignObject x={labelX} y={labelY - 15} width="88" height="34">
                  <button className={`body-zone-pill ${toneClass(toneForZoneState(zone.state))}`} type="button">
                    {zoneDisplayNames[zone.zone]}
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
        <strong>{memberName}</strong>
      </div>

      <div className="body-tiles-grid">
        {zones
          .slice()
          .sort((a, b) => severityRank(a.state) - severityRank(b.state) || zoneDisplayNames[a.zone].localeCompare(zoneDisplayNames[b.zone]))
          .map((zone) => {
            const tile = (
              <>
                <span className={`body-zone-status ${toneClass(toneForZoneState(zone.state))}`}>{zone.state === "noData" ? "No data" : zone.primaryMetric?.statusTitle}</span>
                <h3>{zoneDisplayNames[zone.zone]}</h3>
              </>
            );
            return zone.primaryMetric ? (
              <Link className="body-zone-tile" href={`/app/trends/${zone.primaryMetric.id}`} key={zone.zone}>{tile}</Link>
            ) : (
              <article className="body-zone-tile" key={zone.zone}>{tile}</article>
            );
          })}
      </div>
    </div>
  );
}

function severityRank(state: BodyZoneState) {
  if (state === "critical") return 0;
  if (state === "attention") return 1;
  if (state === "normal") return 2;
  return 3;
}
