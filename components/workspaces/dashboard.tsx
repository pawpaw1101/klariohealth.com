"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BodyVisualization, BodyZoneTiles } from "@/components/body-visualization";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, IconBadge } from "@/components/klario-ui";
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
import type { KlarioIconName } from "@/lib/icons";
import {
  ApiStatusBanner,
  AttentionRecord,
  EmptyState,
  formatDate,
  prettyStatus,
  statusClass,
  valueWithUnit
} from "@/components/workspaces/shared";
type MetricSheetKind = "normal" | "attention" | "critical" | "score";

export function DashboardWorkspace() {
  const api = useKlarioApi();
  const [metricSheet, setMetricSheet] = useState<MetricSheetKind | null>(null);
  const [displayMode, setDisplayMode] = useState<"body" | "tiles">("body");
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
  const summary = dashboard?.health_summary;

  const flagChips: Array<{
    kind: MetricSheetKind;
    value: string;
    label: string;
    caption: string;
    tone: "green" | "orange" | "gray";
    icon: KlarioIconName;
  }> = [
    { kind: "normal", value: summary ? String(summary.normal_count) : "-", label: "Normal", caption: "Inside reference range", tone: "green", icon: "icon_zone_cardio" },
    { kind: "attention", value: summary ? String(summary.attention_count) : "-", label: "Need attention", caption: "Outside range or unreviewed", tone: "orange", icon: "icon_flag_attention" },
    { kind: "score", value: summary ? String(summary.score) : "-", label: "Score", caption: "Percent of metrics in range", tone: "gray", icon: "icon_flag_score" }
  ];

  const inFlightReports = (dashboard?.latest_reports ?? []).filter((report) => !["parsed", "parsed_empty", "needs_attention", "failed"].includes(report.status));
  const normalMetrics = dashboard?.trend_previews ?? [];
  const attentionMetrics = (dashboard?.needs_attention ?? []).filter((item) => item.flag !== "critical");
  const criticalMetrics = (dashboard?.needs_attention ?? []).filter((item) => item.flag === "critical");
  // Critical first so the most urgent items head the list rather than being pushed off by
  // whatever the API happened to return first.
  const attentionPreview = [...criticalMetrics, ...attentionMetrics].slice(0, 4);
  const reportPreview = (dashboard?.latest_reports ?? []).slice(0, 4);

  return (
    <div className="dashboard-one-screen">
      <header className="dashboard-brand-row">
        <h1 className="dashboard-title">Dashboard</h1>
        {api.members.length ? (
          <label className="dashboard-member-switcher">
            <span className="dashboard-member-avatar" aria-hidden="true">{activeLabel.slice(0, 1).toUpperCase()}</span>
            <span className="dashboard-member-name">{activeLabel}</span>
            <span className="dashboard-member-chevron" aria-hidden="true" />
            <select value={api.activeMember?.id ?? ""} onChange={(event) => api.setActiveMemberId(event.target.value)} aria-label="Switch family member">
              {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
            </select>
          </label>
        ) : null}
      </header>

      <ApiStatusBanner />
      {dashboard?.banner ? (
        <Card className="dashboard-server-banner">
          <IconBadge icon="icon_signal_summary" tone="orange" size={36} />
          <p>{dashboard.banner}</p>
        </Card>
      ) : null}

      <div className="dashboard-main">
      <div className="dashboard-flag-strip" aria-label="Health summary">
        {flagChips.map((chip) => (
          <button className={`dashboard-flag-chip tone-${chip.tone}`} key={chip.kind} type="button" onClick={() => setMetricSheet(chip.kind)}>
            <span className="dashboard-flag-icon"><BioIcon name={chip.icon} size={13} /></span>
            <span className="dashboard-flag-text">
              <span className="dashboard-flag-value">{chip.value}</span>
              <span className="dashboard-flag-label">{chip.label}</span>
              <span className="dashboard-flag-caption">{chip.caption}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="dashboard-body-section" aria-label="Body overview">
        <div className="dashboard-display-toggle" role="tablist" aria-label="Body overview display">
          {(["body", "tiles"] as const).map((mode) => (
            <button
              aria-selected={displayMode === mode}
              className={`dashboard-display-option${displayMode === mode ? " is-active" : ""}`}
              key={mode}
              role="tab"
              type="button"
              onClick={() => setDisplayMode(mode)}
            >
              {mode === "body" ? "Body" : "Tiles"}
            </button>
          ))}
        </div>

        <div className="dashboard-body-content">
          {displayMode === "body" ? (
            <BodyVisualization dashboard={dashboard} memberName={activeLabel} isLoading={dashboardQuery.isLoading} />
          ) : (
            <BodyZoneTiles dashboard={dashboard} />
          )}
          {inFlightReports.length ? (
            <span className="dashboard-updating-capsule">
              <span className="body-stage-spinner" />
              Updating from latest report…
            </span>
          ) : null}
        </div>
      </section>

      <section className="dashboard-panels" aria-label="Latest activity">
        <article className="dashboard-panel is-attention">
          <header className="dashboard-panel-head">
            <h2>Needs attention</h2>
            <button className="inline-action" type="button" onClick={() => setMetricSheet("attention")}>View all</button>
          </header>
          {attentionPreview.length ? (
            <ul className="dashboard-panel-list">
              {attentionPreview.map((item) => (
                <li key={item.id}>
                  <Link href={`/app/trends/${item.canonical_metric_id ?? item.id}`}>
                    <span className="dashboard-panel-name">{item.display_name ?? prettyStatus(item.reason_code)}</span>
                    <span className="dashboard-panel-meta">
                      <span>{item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ""}` : prettyStatus(item.reason_code)}</span>
                      {item.flag ? <span className={statusClass(item.flag)}>{prettyStatus(item.flag)}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing flagged" body="Values outside their reference range will appear here." />
          )}
        </article>

        <article className="dashboard-panel is-reports">
          <header className="dashboard-panel-head">
            <h2>Recent reports</h2>
            <Link className="inline-action" href="/app/reports">View all</Link>
          </header>
          {reportPreview.length ? (
            <ul className="dashboard-panel-list">
              {reportPreview.map((report) => (
                <li key={report.document_id}>
                  <Link href={`/app/reports/${report.document_id}`}>
                    <span className="dashboard-panel-name">{report.title}</span>
                    <span className="dashboard-panel-meta">
                      <span>{formatDate(report.created_at)}</span>
                      <span className={statusClass(report.status)}>{prettyStatus(report.status)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No reports yet" body="Upload a report to start building the timeline." />
          )}
        </article>
      </section>
      </div>

      <footer className="dashboard-disclaimer">Based on imported reports and available reference ranges. Not a diagnosis.</footer>
      {metricSheet ? (
        <DashboardMetricModal
          kind={metricSheet}
          familyId={familyId}
          memberId={memberId}
          healthScore={summary?.score ?? 0}
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
  healthScore,
  normalMetrics,
  attentionMetrics,
  criticalMetrics,
  onClose
}: {
  kind: MetricSheetKind;
  familyId?: string;
  memberId?: string;
  healthScore: number;
  normalMetrics: TrendPreview[];
  attentionMetrics: DashboardAttentionItem[];
  criticalMetrics: DashboardAttentionItem[];
  onClose: () => void;
}) {
  const title = kind === "score" ? "Health Score" : `${prettyStatus(kind)} metrics`;
  const usesTrendList = kind === "normal" || kind === "score";
  const trendsQuery = useQuery({
    queryKey: ["dashboard", "metric-modal", "trends", familyId, memberId],
    queryFn: () => trendsApi.list(familyId!, memberId!),
    enabled: usesTrendList && Boolean(familyId && memberId)
  });
  const attentionQuery = useQuery({
    queryKey: ["dashboard", "metric-modal", "attention", familyId, memberId, kind],
    queryFn: () => dashboardApi.attention(familyId!, memberId!, "open", 100, 0, kind),
    enabled: !usesTrendList && Boolean(familyId && memberId)
  });
  const normalItems = trendsQuery.data
    ? trendsQuery.data.categories
        .flatMap((category) => category.metrics)
        .filter((metric) => (kind === "score" ? metric.has_readings !== false : metric.has_readings !== false && !metric.has_attention))
    : normalMetrics;
  const attentionFallback = kind === "critical" ? criticalMetrics : attentionMetrics;
  const attentionItems = attentionQuery.data?.items ?? attentionFallback;
  const isLoading = usesTrendList ? trendsQuery.isLoading : attentionQuery.isLoading;

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
        {kind === "score" ? (
          <div className="dashboard-score-header">
            <strong>{healthScore}</strong>
            <span>Percent of metrics in normal range</span>
          </div>
        ) : null}
        <div className="dashboard-modal-list">
          {usesTrendList ? (
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
