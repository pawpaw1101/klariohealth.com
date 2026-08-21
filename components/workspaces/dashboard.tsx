"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BodyVisualization, BodyZoneTiles, type BodySystemZone, zoneDisplayNames, zoneForMetricName } from "@/components/body-visualization";
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
  TrendCategoryGroup,
  TrendPreview
} from "@/lib/api/types";
import type { KlarioIconName } from "@/lib/icons";
import { protectedQueryKey, queryFreshness } from "@/lib/query-cache";
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

const categoryPresentation: Record<BodySystemZone, { title: string; description: string; markerTitle: string }> = {
  cardio: { title: "Your cardiovascular overview", description: "Track key heart-related markers that support cardiovascular health.", markerTitle: "Cardiovascular markers" },
  metabolic: { title: "Your metabolic overview", description: "Track key markers related to glucose, metabolism, and energy balance.", markerTitle: "Metabolic markers" },
  kidney: { title: "Your kidney overview", description: "Track key markers that help monitor kidney function.", markerTitle: "Kidney markers" },
  blood: { title: "Your blood overview", description: "Track key haematology markers that support blood health.", markerTitle: "Blood markers" },
  brain: { title: "Your brain & nerves overview", description: "Track key neurological and nerve-related markers.", markerTitle: "Brain & nerve markers" },
  thyroid: { title: "Your thyroid overview", description: "Track thyroid hormone markers that support thyroid monitoring.", markerTitle: "Thyroid markers" },
  liver: { title: "Your liver overview", description: "Track key markers related to liver function.", markerTitle: "Liver markers" },
  inflammation: { title: "Your inflammation overview", description: "Track key markers that help you and your care team monitor inflammation.", markerTitle: "Inflammation markers" },
  lungs: { title: "Your lungs overview", description: "Track respiratory markers that help monitor lung health.", markerTitle: "Lung markers" }
};

export function DashboardWorkspace() {
  const api = useKlarioApi();
  const [metricSheet, setMetricSheet] = useState<MetricSheetKind | null>(null);
  const [selectedZone, setSelectedZone] = useState<BodySystemZone | null>(null);
  const [displayMode, setDisplayMode] = useState<"body" | "tiles">("body");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const hasLiveContext = api.status === "live" && Boolean(api.user?.id && familyId && memberId);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "dashboard", familyId, memberId),
    queryFn: () => dashboardApi.get(familyId!, memberId!),
    enabled: hasLiveContext,
    // Dashboard state changes while a report is parsing. A 60-second workspace cache allowed
    // two browsers to render different category tones and bottom states for the same account.
    ...queryFreshness.processing,
    refetchInterval: (query) => {
      const reports = query.state.data?.latest_reports ?? [];
      return reports.some((report) => !["parsed", "parsed_empty", "needs_attention", "failed"].includes(report.status))
        ? 5_000
        : false;
    }
  });
  const categoryTrendsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "dashboard", "category-overview", familyId, memberId),
    queryFn: () => trendsApi.list(familyId!, memberId!),
    enabled: hasLiveContext && Boolean(selectedZone),
    ...queryFreshness.workspace
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
            <BodyVisualization dashboard={dashboard} memberName={activeLabel} isLoading={dashboardQuery.isLoading} onSelectZone={setSelectedZone} />
          ) : (
            <BodyZoneTiles dashboard={dashboard} onSelectZone={setSelectedZone} />
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
          userId={api.user?.id}
          familyId={familyId}
          memberId={memberId}
          healthScore={summary?.score ?? 0}
          normalMetrics={normalMetrics}
          attentionMetrics={attentionMetrics}
          criticalMetrics={criticalMetrics}
          onClose={() => setMetricSheet(null)}
        />
      ) : null}
      {selectedZone ? (
        <DashboardCategoryModal
          memberName={activeLabel}
          categories={categoryTrendsQuery.data?.categories ?? []}
          isLoading={categoryTrendsQuery.isLoading}
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      ) : null}
      {isUploadOpen && portalHost ? createPortal(<ReportUploadModal onClose={() => setIsUploadOpen(false)} />, portalHost) : null}
    </div>
  );
}

function DashboardCategoryModal({
  memberName,
  categories,
  isLoading,
  zone,
  onClose
}: {
  memberName: string;
  categories: TrendCategoryGroup[];
  isLoading: boolean;
  zone: BodySystemZone;
  onClose: () => void;
}) {
  const presentation = categoryPresentation[zone];
  const metrics = categories.flatMap((category) => category.metrics).filter((metric) => zoneForMetricName(metric.display_name) === zone);
  const criticalCount = metrics.filter((metric) => metric.latest_flag?.toLowerCase() === "critical").length;
  const attentionCount = metrics.filter((metric) => metric.has_attention && metric.latest_flag?.toLowerCase() !== "critical").length;
  const normalCount = metrics.filter((metric) => metric.has_readings !== false && !metric.has_attention).length;

  return (
    <div className="klario-modal-overlay" role="presentation">
      <section className="klario-modal dashboard-category-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-category-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="dashboard-category-title">{zoneDisplayNames[zone]}</h2>
            <p>All values for {memberName}.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" onClick={onClose} aria-label="Close category overview"><BioIcon name="icon_action_reject" size={18} /></button>
        </div>
        <div className="dashboard-category-summary">
          <div><strong>{memberName}</strong><span>{metrics.length} {metrics.length === 1 ? "metric" : "metrics"}</span></div>
          <div className="dashboard-category-counts">
            {criticalCount ? <span className="status-critical">{criticalCount} Critical</span> : null}
            {attentionCount ? <span className="status-attention">{attentionCount} Needs attention</span> : null}
            {normalCount ? <span className="status-normal">{normalCount} Normal</span> : null}
          </div>
        </div>
        <div className="dashboard-category-copy"><strong>{presentation.title}</strong><p>{presentation.description}</p></div>
        <div className="dashboard-category-list">
          <h3>{presentation.markerTitle}</h3>
          {metrics.length ? metrics.map((metric) => (
            <Link className="dashboard-category-record" href={`/app/trends/${metric.canonical_metric_id}`} key={metric.canonical_metric_id} onClick={onClose}>
              <span><strong>{metric.display_name}</strong><small>{metric.reading_count} {metric.reading_count === 1 ? "reading" : "readings"}</small></span>
              <span className="dashboard-category-value">{valueWithUnit(metric.latest_value, metric.unit)}<small className={metric.has_attention ? "status-attention" : "status-normal"}>{metric.has_attention ? prettyStatus(metric.latest_flag ?? "needs_attention") : "In range"}</small></span>
            </Link>
          )) : isLoading ? <EmptyState title="Loading values" body="Fetching all category values." /> : <EmptyState title={`No ${zoneDisplayNames[zone]} values yet`} body="This category will populate when a report includes matching markers." />}
        </div>
      </section>
    </div>
  );
}

function DashboardMetricModal({
  kind,
  userId,
  familyId,
  memberId,
  healthScore,
  normalMetrics,
  attentionMetrics,
  criticalMetrics,
  onClose
}: {
  kind: MetricSheetKind;
  userId?: string;
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
    queryKey: protectedQueryKey(userId, "dashboard", "metric-modal", "trends", familyId, memberId),
    queryFn: () => trendsApi.list(familyId!, memberId!),
    enabled: usesTrendList && Boolean(userId && familyId && memberId),
    ...queryFreshness.workspace
  });
  const attentionQuery = useQuery({
    queryKey: protectedQueryKey(userId, "dashboard", "metric-modal", "attention", familyId, memberId, kind),
    queryFn: () => dashboardApi.attention(familyId!, memberId!, "open", 100, 0, kind),
    enabled: !usesTrendList && Boolean(userId && familyId && memberId),
    ...queryFreshness.workspace
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
    queryKey: protectedQueryKey(api.user?.id, "attention", "list", familyId, memberId, filter),
    queryFn: () => dashboardApi.attention(familyId!, memberId!, filter, 100, 0),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && memberId),
    ...queryFreshness.workspace
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
