"use client";

import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { EmptyState as KlarioEmptyState } from "@/components/klario-ui";
import { useKlarioApi } from "@/components/klario-api-provider";
import type { KlarioIconName } from "@/lib/icons";
import { toneClass, toneForStatus } from "@/lib/tone";
import type {
  AttentionItemStatus,
  Document as KlarioDocument,
  DocumentType,
  MemberAttentionItem,
  ParsedResult,
  TrendMetricPreview
} from "@/lib/api/types";
export const documentTypes: DocumentType[] = ["lab_report", "prescription", "imaging", "discharge", "vaccination", "invoice", "general"];

export function ApiStatusBanner() {
  const api = useKlarioApi();

  if (api.status === "live" && api.activeFamily && api.activeMember) return null;

  const message = api.message ??
    (api.status === "live"
      ? "Choose a profile on Home, or upload your first report to load summaries."
      : api.status === "checking"
        ? "Connecting to your workspace..."
        : "Could not reach the API. Check that the backend is running.");

  return (
    <div className={`app-status-banner is-${api.status}`}>
      <div>
        <strong>{api.status === "checking" ? "Checking backend" : prettyStatus(api.status)}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function DocumentRecord({
  document,
  deleting = false,
  onDelete
}: {
  document: KlarioDocument;
  deleting?: boolean;
  onDelete?: (documentId: string) => void;
}) {
  return (
    <article className="record document-record">
      <div className="record-meta">
        <span>{formatDate(document.created_at)}</span>
        <span className={statusClass(document.status)}>{prettyStatus(document.status)}</span>
        <span>{prettyStatus(document.document_type)}</span>
      </div>
      <h3>{document.title}</h3>
      <p>{document.original_filename}. {formatFileSize(document.file_size)}.</p>
      <div className="button-row compact">
        <Link className="button button-secondary" href={`/app/reports/${document.id}`}>Open report</Link>
        {onDelete ? (
          <button className="button button-ghost danger-action" type="button" disabled={deleting} onClick={() => onDelete(document.id)}>
            {deleting ? "Deleting" : "Delete"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function TrendMetricCard({ metric, active, onSelect }: { metric: TrendMetricPreview & { category?: string }; active: boolean; onSelect: () => void }) {
  return (
    <button className={`trend-card${active ? " is-active" : ""}`} type="button" onClick={onSelect}>
      <div>
        <h3>{metric.display_name}</h3>
        <p>{metric.category ?? "Trend"} · {metric.reading_count} readings</p>
      </div>
      <strong>{valueWithUnit(metric.latest_value, metric.unit)}</strong>
      {metric.has_attention ? <span className="status-chip is-warning">Needs attention</span> : null}
    </button>
  );
}

export function AttentionRecord({
  item,
  canResolve,
  isWorking,
  onUpdate
}: {
  item: MemberAttentionItem;
  canResolve: boolean;
  isWorking: boolean;
  onUpdate: (status: Exclude<AttentionItemStatus, "open">) => void;
}) {
  const actionable = item.source === "attention_item";

  return (
    <article className="record attention-record">
      <div className="record-meta">
        <span>{formatDate(item.created_at)}</span>
        <span className={statusClass(item.status)}>{prettyStatus(item.status)}</span>
        <span>{prettyStatus(item.source)}</span>
      </div>
      <div className="attention-record-main">
        <div>
          <h3>{item.display_name ?? prettyStatus(item.reason_code)}</h3>
          <p>{prettyStatus(item.reason_code)}.</p>
        </div>
        {item.value ? (
          <strong className="attention-value">
            {item.value}{item.unit ? ` ${item.unit}` : ""}
          </strong>
        ) : null}
      </div>
      <div className="button-row compact">
        <button className="button button-secondary" type="button" disabled={!canResolve || !actionable || isWorking} onClick={() => onUpdate("accepted")}>Accept</button>
        <button className="button button-ghost" type="button" disabled={!canResolve || !actionable || isWorking} onClick={() => onUpdate("rejected")}>Reject</button>
        <button className="button button-ghost" type="button" disabled={!canResolve || !actionable || isWorking} onClick={() => onUpdate("resolved")}>Resolve</button>
      </div>
    </article>
  );
}

export function ParsedResultRecord({ result }: { result: ParsedResult }) {
  const value = result.numeric_value !== null ? valueWithUnit(result.numeric_value, result.unit) : result.text_value ?? "No value";
  const measuredDate = result.measured_at ? formatDate(result.measured_at) : formatDate(result.created_at);

  return (
    <article className="record parsed-result-record">
      <div className="parsed-result-main">
        <span className="parsed-result-marker" aria-hidden="true">
          <BioIcon name="icon_filter_metric" size={18} />
        </span>
        <div className="parsed-result-copy">
          <div className="record-meta parsed-result-meta">
            <span>{prettyStatus(result.category)}</span>
            <span>{measuredDate}</span>
            {result.result_flag ? <span className={statusClass(result.result_flag)}>{prettyStatus(result.result_flag)}</span> : null}
          </div>
          <h3>{result.display_name}</h3>
        </div>
        <strong className="parsed-result-value">{value}</strong>
      </div>
      <div className="tag-row parsed-result-tags">
        {result.reference_text ? <span className="tag">{result.reference_text}</span> : null}
        <span className="tag">{Math.round(result.parser_confidence * 100)}% confidence</span>
      </div>
    </article>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return <KlarioEmptyState title={title} body={body} actionLabel={actionLabel} actionHref={actionHref} variant="inline" />;
}

export function statusClass(status: string) {
  return `status-chip ${toneClass(toneForStatus(status))}`;
}

export function Sparkline({ points }: { points: number[] }) {
  const safePoints = points.length ? points : [0, 0];
  const width = 340;
  const height = 128;
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const spread = max - min || 1;
  const path = safePoints
    .map((point, index) => {
      const x = (index / Math.max(safePoints.length - 1, 1)) * width;
      const y = height - ((point - min) / spread) * (height - 28) - 14;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biomarker trend chart">
      <path d={area} className="sparkline-area" />
      <path d={path} className="sparkline-line" />
      {safePoints.map((point, index) => {
        const x = (index / Math.max(safePoints.length - 1, 1)) * width;
        const y = height - ((point - min) / spread) * (height - 28) - 14;
        return <circle key={`${point}-${index}`} cx={x} cy={y} r="4" />;
      })}
    </svg>
  );
}

export function PreferenceCard({ icon, title, body, action, href }: {
  icon: KlarioIconName;
  title: string;
  body: string;
  action: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="feature-icon" aria-hidden="true"><BioIcon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      <span className="inline-action">{action}</span>
    </>
  );

  if (href) {
    return <Link className="card preference-card" href={href}>{content}</Link>;
  }

  return <article className="card preference-card">{content}</article>;
}

export function prettyStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function valueWithUnit(value: number | null, unit: string | null) {
  if (value === null) return "No value";
  return `${value}${unit ? ` ${unit}` : ""}`;
}
