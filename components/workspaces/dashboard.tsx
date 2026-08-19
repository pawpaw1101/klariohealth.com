"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BodyVisualization } from "@/components/body-visualization";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, IconBadge, RootPageHeader, StatusPill } from "@/components/klario-ui";
import { ReportUploadModal } from "@/components/workspaces/reports";
import {
  attentionApi,
  canResolveAttention,
  dashboardApi,
  trendsApi
} from "@/lib/api/klario-api";
import type {
  AttentionItemStatus,
  DashboardAttentionItem,
  TrendPreview
} from "@/lib/api/types";
import {
  ApiStatusBanner,
  AttentionRecord,
  EmptyState,
  Sparkline,
  formatDate,
  prettyStatus,
  statusClass,
  valueWithUnit
} from "@/components/workspaces/shared";
export function DashboardWorkspace() {
  const api = useKlarioApi();
  const [metricSheet, setMetricSheet] = useState<"normal" | "attention" | "critical" | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const hasLiveContext = api.status === "live" && Boolean(familyId && memberId);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", familyId, memberId],
    queryFn: () => dashboardApi.get(familyId!, memberId!),
    enabled: hasLiveContext
  });

  const activeLabel = api.activeMember?.display_name ?? "your profile";
  const dashboard = dashboardQuery.data;
  const latestDocumentId = dashboard?.health_summary.last_report?.document_id ?? dashboard?.latest_reports[0]?.document_id;

  const metrics = dashboard
    ? [
        { value: String(dashboard.health_summary.score), label: "Health score", body: dashboard.health_summary.score_note },
        { value: String(dashboard.health_summary.normal_count), label: "In range", body: "Results inside available reference ranges." },
        { value: String(dashboard.health_summary.attention_count), label: "Needs attention", body: "Items waiting for review or confirmation." },
        { value: String(dashboard.health_summary.critical_count), label: "Critical flags", body: "Values marked as high priority." }
      ]
    : [
        { value: "-", label: "Health score", body: "Upload a report to generate your summary." },
        { value: "-", label: "In range", body: "Parsed values will appear here." },
        { value: "-", label: "Needs attention", body: "Review items will appear here." },
        { value: "-", label: "Critical flags", body: "High-priority flags will appear here." }
      ];
  const scoreMetric = metrics[0];
  const supportingMetrics = metrics.slice(1);
  const flagCards: Array<{
    kind: "normal" | "attention" | "critical";
    value: string;
    label: string;
    body: string;
    tone: "green" | "orange" | "red";
  }> = [
    { kind: "normal", value: supportingMetrics[0].value, label: "Normal", body: supportingMetrics[0].body, tone: "green" },
    { kind: "attention", value: supportingMetrics[1].value, label: "Attention", body: supportingMetrics[1].body, tone: "orange" },
    { kind: "critical", value: supportingMetrics[2].value, label: "Critical", body: supportingMetrics[2].body, tone: "red" }
  ];
  const inFlightReports = (dashboard?.latest_reports ?? []).filter((report) => !["parsed", "parsed_empty", "needs_attention", "failed"].includes(report.status));
  const normalMetrics = dashboard?.trend_previews ?? [];
  const attentionMetrics = (dashboard?.needs_attention ?? []).filter((item) => item.flag !== "critical");
  const criticalMetrics = (dashboard?.needs_attention ?? []).filter((item) => item.flag === "critical");
  const lastTest = dashboard?.health_summary.last_report
    ? `Last test - ${dashboard.health_summary.last_report.title}, ${formatDate(dashboard.health_summary.last_report.date)}`
    : "Last test - upload a report to begin";
  return (
    <div className="dashboard-one-screen">
      <RootPageHeader
        title="Dashboard"
        subtitle={dashboard?.health_summary.status_sentence ?? `Health workspace for ${activeLabel}.`}
        action={
          api.members.length ? (
            <label className="dashboard-member-switcher">
              <span className="dashboard-member-avatar" aria-hidden="true">{activeLabel.slice(0, 1).toUpperCase()}</span>
              <select value={api.activeMember?.id ?? ""} onChange={(event) => api.setActiveMemberId(event.target.value)} aria-label="Switch active profile">
                {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
              </select>
            </label>
          ) : null
        }
      />

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <h1>{dashboard?.health_summary.status_sentence ?? "Your health workspace is ready"}</h1>
          <p>{dashboard?.health_summary.score_note ?? `Your health overview for ${activeLabel}. Upload a report to populate summaries.`}</p>
          <div className="dashboard-actions">
            <button className="button button-primary" type="button" onClick={() => setIsUploadOpen(true)}>
              <BioIcon name="icon_doc_add_empty" size={17} />
              Upload report
            </button>
            {latestDocumentId ? (
              <Link className="button button-secondary" href={`/app/reports/${latestDocumentId}`}>
                View latest
              </Link>
            ) : null}
          </div>
        </div>
        <HealthScoreCard
          name={activeLabel}
          lastTest={lastTest}
          score={scoreMetric.value}
          note={scoreMetric.body}
          metrics={supportingMetrics}
        />
      </section>

      <ApiStatusBanner />
      {dashboard?.banner ? (
        <Card className="dashboard-server-banner">
          <IconBadge icon="icon_signal_summary" tone="orange" size={36} />
          <p>{dashboard.banner}</p>
        </Card>
      ) : null}

      <section className="dashboard-flag-strip" aria-label="Dashboard flags">
        {flagCards.map((card) => (
          <button className={`dashboard-flag-card tone-${card.tone}`} key={card.kind} type="button" onClick={() => setMetricSheet(card.kind)}>
            <span className="dashboard-flag-value">{card.value}</span>
            <span className="dashboard-flag-title">{card.label}</span>
            <span className="dashboard-flag-body">{card.body}</span>
          </button>
        ))}
      </section>

      {inFlightReports.length ? (
        <section className="dashboard-import-progress">
          <div>
            <span className="control-label">Import progress</span>
            <h2>Updating from latest report</h2>
            <p>{inFlightReports.length} report{inFlightReports.length === 1 ? "" : "s"} still processing.</p>
          </div>
          <div className="record-list compact">
            {inFlightReports.slice(0, 2).map((report) => (
              <article className="record" key={report.document_id}>
                <div className="record-meta">
                  <span>{report.title}</span>
                  <span className={statusClass(report.status)}>{prettyStatus(report.status)}</span>
                </div>
                <p>{formatDate(report.created_at)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="dashboard-body-panel">
        <BodyVisualization dashboard={dashboard} memberName={activeLabel} />
      </section>

      <p className="note app-disclaimer">Based on imported reports and available reference ranges. Not a diagnosis.</p>
      {metricSheet ? (
        <DashboardMetricModal
          kind={metricSheet}
          familyId={familyId}
          memberId={memberId}
          normalMetrics={normalMetrics}
          attentionMetrics={attentionMetrics}
          criticalMetrics={criticalMetrics}
          onClose={() => setMetricSheet(null)}
        />
      ) : null}
      {isUploadOpen && portalHost ? createPortal(<ReportUploadModal onClose={() => setIsUploadOpen(false)} />, portalHost) : null}
    </div>
  );
}

function DashboardMetricModal({
  kind,
  familyId,
  memberId,
  normalMetrics,
  attentionMetrics,
  criticalMetrics,
  onClose
}: {
  kind: "normal" | "attention" | "critical";
  familyId?: string;
  memberId?: string;
  normalMetrics: TrendPreview[];
  attentionMetrics: DashboardAttentionItem[];
  criticalMetrics: DashboardAttentionItem[];
  onClose: () => void;
}) {
  const title = `${prettyStatus(kind)} metrics`;
  const trendsQuery = useQuery({
    queryKey: ["dashboard", "metric-modal", "trends", familyId, memberId],
    queryFn: () => trendsApi.list(familyId!, memberId!),
    enabled: kind === "normal" && Boolean(familyId && memberId)
  });
  const attentionQuery = useQuery({
    queryKey: ["dashboard", "metric-modal", "attention", familyId, memberId, kind],
    queryFn: () => dashboardApi.attention(familyId!, memberId!, "open", 100, 0, kind),
    enabled: kind !== "normal" && Boolean(familyId && memberId)
  });
  const normalItems = trendsQuery.data
    ? trendsQuery.data.categories
        .flatMap((category) => category.metrics)
        .filter((metric) => metric.has_readings !== false && !metric.has_attention)
    : normalMetrics;
  const attentionFallback = kind === "critical" ? criticalMetrics : attentionMetrics;
  const attentionItems = attentionQuery.data?.items ?? attentionFallback;
  const isLoading = kind === "normal" ? trendsQuery.isLoading : attentionQuery.isLoading;

  return (
    <div className="klario-modal-overlay" role="presentation">
      <div className="klario-modal dashboard-metric-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-metric-modal-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="dashboard-metric-modal-title">{title}</h2>
            <p>Live dashboard metrics for the selected profile.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" onClick={onClose} aria-label="Close metric list">
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        <div className="dashboard-modal-list">
          {kind === "normal" ? (
            normalItems.length ? normalItems.map((metric) => (
              <Link className="record dashboard-modal-record" href={`/app/trends/${metric.canonical_metric_id}`} key={metric.canonical_metric_id}>
                <div className="record-meta">
                  <span>{metric.display_name}</span>
                  <span>{metric.sparkline.length ? `${metric.sparkline.length} points` : "No points"}</span>
                </div>
                <p>{valueWithUnit(metric.latest_value, metric.unit)}</p>
              </Link>
            )) : isLoading ? <EmptyState title="Loading normal metrics" body="Fetching the full metric list." /> : <EmptyState title="No normal metrics" body="Normal tracked metrics appear after reports are parsed." />
          ) : (
            attentionItems.length ? attentionItems.map((item) => (
              <Link className="record dashboard-modal-record" href={`/app/trends/${item.canonical_metric_id ?? item.id}`} key={item.id}>
                <div className="record-meta">
                  <span>{item.display_name ?? prettyStatus(item.reason_code)}</span>
                  {item.flag ? <span className={statusClass(item.flag)}>{prettyStatus(item.flag)}</span> : null}
                </div>
                <p>{item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ""}` : prettyStatus(item.reason_code)}</p>
              </Link>
            )) : isLoading ? <EmptyState title={`Loading ${kind} metrics`} body="Fetching the full metric list." /> : <EmptyState title={`No ${kind} metrics`} body="Metrics appear here after parsed reports identify them." />
          )}
        </div>
      </div>
    </div>
  );
}

function HealthScoreCard({
  name,
  lastTest,
  score,
  note,
  metrics
}: {
  name: string;
  lastTest: string;
  score: string;
  note: string;
  metrics: { value: string; label: string; body: string }[];
}) {
  return (
    <aside className="dashboard-health-score-card" aria-label="Health score summary">
      <div className="health-score-card-head">
        <div>
          <span className="control-label">Health score</span>
          <strong>{name}</strong>
        </div>
        <StatusPill tone="brand">Updated</StatusPill>
      </div>
      <div className="health-score-value-row">
        <span className="health-score-value">{score}</span>
        <div>
          <h2>Health score</h2>
          <p>{note}</p>
        </div>
      </div>
      <div className="health-score-mini-grid" aria-label="Health score details">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <p className="health-score-last-test">{lastTest}</p>
    </aside>
  );
}

export function AttentionWorkspace() {
  const api = useKlarioApi();
  const [filter, setFilter] = useState("open");
  const [message, setMessage] = useState("");
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const attentionQuery = useQuery({
    queryKey: ["attention", "list", familyId, memberId, filter],
    queryFn: () => dashboardApi.attention(familyId!, memberId!, filter, 100, 0),
    enabled: api.status === "live" && Boolean(familyId && memberId)
  });
  const resolveAllowed = canResolveAttention(api.currentRole);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<AttentionItemStatus, "open"> }) => attentionApi.update(id, { status }),
    onSuccess: async () => {
      setMessage("Attention item updated.");
      await api.invalidateWorkspaceData();
      await attentionQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "You don't have permission to change this.")
  });

  const itemCount = attentionQuery.data?.total ?? attentionQuery.data?.items.length ?? 0;

  return (
    <div className="flat-workspace attention-workspace">
      <div className="flat-workspace-head">
        <div>
          <h1>Review queue</h1>
          <p>{itemCount ? `${itemCount} ${filter === "open" ? "open" : prettyStatus(filter).toLowerCase()} items` : "Review extracted values that need a decision."}</p>
        </div>
      </div>
      <ApiStatusBanner />
      <div className="workspace-bar attention-toolbar">
        <div className="filter-group" aria-label="Attention status">
          {["open", "accepted", "rejected", "resolved"].map((option) => (
            <button key={option} className={`pill-button${filter === option ? " is-active" : ""}`} type="button" onClick={() => setFilter(option)}>
              {prettyStatus(option)}
            </button>
          ))}
        </div>
        {!resolveAllowed ? <span className="status-chip is-warning">Read only</span> : null}
      </div>

      <section className="record-list attention-list">
        {attentionQuery.data ? (
          attentionQuery.data.items.length ? (
            attentionQuery.data.items.map((item) => (
              <AttentionRecord key={item.id} item={item} canResolve={resolveAllowed} isWorking={updateMutation.isPending} onUpdate={(status) => updateMutation.mutate({ id: item.id, status })} />
            ))
          ) : (
            <EmptyState title="No attention items" body="Open parser questions and out-of-range extracted results will appear here." />
          )
        ) : attentionQuery.isLoading ? (
          <EmptyState title="Loading attention items" body="Fetching items that need review." />
        ) : (
          <EmptyState title="Select a family member" body="Choose a member with parsed reports to review attention items." />
        )}
      </section>
      {message ? <p className="note">{message}</p> : null}
    </div>
  );
}
