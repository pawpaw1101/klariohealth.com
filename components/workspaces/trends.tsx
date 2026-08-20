"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import {
  Card,
  FilterChip,
  IconBadge,
  RootPageHeader,
  SearchField,
  SectionHeader as KlarioSectionHeader,
  SkeletonCard,
  StatusPill
} from "@/components/klario-ui";
import { metricsApi, trendsApi } from "@/lib/api/klario-api";
import { protectedQueryKey, queryFreshness } from "@/lib/query-cache";
import type { MetricCatalogItem, MetricCategory, TrendCategoryGroup, TrendMetricPreview, TrendRange } from "@/lib/api/types";
import { toneForLabFlag, toneForStatus, type BioStatusTone } from "@/lib/tone";
import { ApiStatusBanner, EmptyState, InteractiveTrendChart, Sparkline, formatDate, prettyStatus, statusClass, valueWithUnit } from "@/components/workspaces/shared";

const rangeOptions: TrendRange[] = ["week", "month", "6m", "year", "all"];
const emptyTrendCategories: TrendCategoryGroup[] = [];

function categoryTone(categoryId: string): BioStatusTone {
  const normalized = categoryId.toLowerCase();
  if (normalized.includes("liver") || normalized.includes("thyroid") || normalized.includes("enzyme")) return "orange";
  if (normalized.includes("blood") || normalized.includes("pressure") || normalized.includes("cardio")) return "red";
  if (normalized.includes("kidney") || normalized.includes("metabolic") || normalized.includes("glucose")) return "blue";
  if (normalized.includes("vitamin") || normalized.includes("immune")) return "green";
  return "brand";
}

function metricMatches(metric: TrendMetricPreview, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [metric.display_name, metric.canonical_metric_id, metric.unit ?? ""].some((value) => value.toLowerCase().includes(needle));
}

function flagged(metric: TrendMetricPreview) {
  return Boolean(metric.has_attention || (metric.latest_flag && metric.latest_flag !== "normal"));
}

function pointValues(data: Awaited<ReturnType<typeof trendsApi.detail>> | undefined) {
  if (!data || !("points" in data)) return [];
  return data.points.map((point) => ("value" in point ? point.value ?? 0 : point.systolic));
}

function referenceRange(data: Awaited<ReturnType<typeof trendsApi.detail>> | undefined) {
  if (!data || !("points" in data)) return null;
  for (const point of data.points) {
    if ("reference_min" in point && point.reference_min !== null && point.reference_max !== null) {
      return { min: point.reference_min, max: point.reference_max };
    }
  }
  return null;
}

function ReferenceRangeScale({
  minimum,
  maximum,
  value,
  unit
}: {
  minimum: number;
  maximum: number;
  value: number | null | undefined;
  unit: string | null;
}) {
  const api = useKlarioApi();
  const span = Math.max(maximum - minimum, 1);
  const domainStart = minimum - span * 0.22;
  const domainEnd = maximum + span * 0.22;
  const position = value === null || value === undefined
    ? null
    : Math.max(0, Math.min(100, ((value - domainStart) / (domainEnd - domainStart)) * 100));

  return (
    <div className="trend-reference-scale" aria-label={`Reference range ${minimum} to ${maximum}${unit ? ` ${unit}` : ""}`}>
      <div className="trend-reference-scale-markers" aria-hidden="true">
        <i className="is-bound is-start" />
        <i className="is-bound is-end" />
        {position !== null ? <i className="is-reading" style={{ "--reference-value-position": `${position}%` } as CSSProperties} /> : null}
      </div>
      <div className="trend-reference-scale-track" aria-hidden="true"><span /></div>
      <div className="trend-reference-scale-labels" aria-hidden="true">
        <span>{minimum}</span>
        <span>{maximum}</span>
        {position !== null && value !== null && value !== undefined ? <strong style={{ "--reference-value-position": `${position}%` } as CSSProperties}>{value}</strong> : null}
      </div>
    </div>
  );
}

function TrendMetricRow({
  metric
}: {
  metric: TrendMetricPreview & { categoryName: string };
}) {
  const tone = toneForLabFlag(metric.latest_flag);
  return (
    <Link className="trend-metric-row" href={`/app/trends/${metric.canonical_metric_id}`}>
      <span className="trend-metric-row-main">
        <span>
          <strong>{metric.display_name}</strong>
          <small>{metric.categoryName} - {metric.reading_count} readings</small>
        </span>
        <span className="trend-metric-row-value">{valueWithUnit(metric.latest_value, metric.unit)}</span>
      </span>
      <div className="trend-metric-row-actions">
        {metric.latest_flag ? <StatusPill tone={tone}>{prettyStatus(metric.latest_flag)}</StatusPill> : <StatusPill tone="gray">No flag</StatusPill>}
        <BioIcon name="icon_action_continue" size={18} />
      </div>
    </Link>
  );
}

function AddMetricsModal({
  familyId,
  memberId,
  categories,
  trackedMetricIds,
  onClose,
  onChanged
}: {
  familyId: string;
  memberId: string;
  categories: MetricCategory[];
  trackedMetricIds: Set<string>;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const api = useKlarioApi();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!categoryId && categories.length) {
      setCategoryId(categories[0].category_id);
    }
  }, [categories, categoryId]);

  const catalogQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "metrics", "catalog", categoryId, query),
    queryFn: () => metricsApi.catalog({ category_id: categoryId || undefined, search: query || undefined }),
    enabled: Boolean(api.user?.id && memberId),
    ...queryFreshness.catalog
  });

  const trackMutation = useMutation({
    mutationFn: (canonicalMetricId: string) => metricsApi.track(familyId, memberId, { canonical_metric_id: canonicalMetricId }),
    onSuccess: async () => {
      setMessage("Metric added.");
      await onChanged();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Metric could not be added.")
  });
  const untrackMutation = useMutation({
    mutationFn: (canonicalMetricId: string) => metricsApi.untrack(familyId, memberId, canonicalMetricId),
    onSuccess: async () => {
      setMessage("Metric removed.");
      await onChanged();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Metric could not be removed.")
  });

  const metrics = catalogQuery.data ?? [];
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  const modal = (
    <div className="klario-modal-overlay" role="presentation">
      <div className="klario-modal trends-add-modal" role="dialog" aria-modal="true" aria-labelledby="add-metrics-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="add-metrics-title">Add metrics</h2>
            <p>Choose a category and add metrics to this profile.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" onClick={onClose} aria-label="Close add metrics">
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        <div className="trends-add-controls">
          <SearchField value={query} onChange={setQuery} placeholder="Search metrics" label="Search metrics" />
          <label className="select-field">
            <span className="sr-only">Metric category</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>{category.display_name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="trends-catalog-list">
          {catalogQuery.isLoading ? (
            <SkeletonCard />
          ) : metrics.length ? (
            metrics.map((metric) => {
              const isTracked = trackedMetricIds.has(metric.canonical_id);
              const busy = trackMutation.variables === metric.canonical_id || untrackMutation.variables === metric.canonical_id;
              return (
                <article className="trend-catalog-row" key={metric.canonical_id}>
                  <IconBadge icon="icon_filter_metric" tone={categoryTone(metric.category)} size={36} />
                  <div>
                    <h3>{metric.display_name}</h3>
                    <p>{metric.supported_units.length ? metric.supported_units.join(", ") : prettyStatus(metric.value_type)}</p>
                  </div>
                  <button
                    className={`button ${isTracked ? "button-ghost" : "button-secondary"}`}
                    type="button"
                    disabled={busy}
                    onClick={() => isTracked ? untrackMutation.mutate(metric.canonical_id) : trackMutation.mutate(metric.canonical_id)}
                  >
                    {isTracked ? "Remove" : "Add"}
                  </button>
                </article>
              );
            })
          ) : (
            <EmptyState title="No metrics found" body="Try another category or search term." />
          )}
        </div>
        {message ? <p className="note">{message}</p> : null}
      </div>
    </div>
  );

  return portalHost ? createPortal(modal, portalHost) : null;
}

export function TrendsWorkspace() {
  const api = useKlarioApi();
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState(api.activeMember?.id ?? "");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const didInitializeExpandedCategories = useRef(false);
  const familyId = api.activeFamily?.id;

  useEffect(() => {
    if (!memberId && api.activeMember?.id) setMemberId(api.activeMember.id);
  }, [api.activeMember?.id, memberId]);

  const trendsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "trends", "list", familyId, memberId),
    queryFn: () => trendsApi.list(familyId!, memberId),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && memberId),
    ...queryFreshness.workspace
  });
  const trackedQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "metrics", "tracked", familyId, memberId),
    queryFn: () => metricsApi.tracked(familyId!, memberId),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && memberId),
    ...queryFreshness.workspace
  });
  const categoriesQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "metrics", "categories"),
    queryFn: () => metricsApi.categories({ active_only: true }),
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.catalog
  });

  const categories = trendsQuery.data?.categories ?? emptyTrendCategories;
  const flatMetrics = useMemo(
    () => categories.flatMap((category) => category.metrics.map((metric) => ({ ...metric, categoryName: category.display_name, categoryId: category.category }))),
    [categories]
  );
  const filteredCategories = useMemo(
    () => categories
      .map((category) => ({
        ...category,
        metrics: category.metrics
          .filter((metric) => metricMatches(metric, query))
          .filter((metric) => !flaggedOnly || flagged(metric))
      }))
      .filter((category) => category.metrics.length),
    [categories, flaggedOnly, query]
  );
  // Depend on the visible category identity, not the derived array instance. React Query may
  // provide a new array reference during background revalidation even when its contents match.
  const visibleCategorySignature = filteredCategories.map((category) => category.category).join("|");
  const trackedMetricIds = useMemo(() => new Set((trackedQuery.data ?? []).map((metric) => metric.canonical_metric_id)), [trackedQuery.data]);
  const flaggedCount = flatMetrics.filter(flagged).length;

  useEffect(() => {
    if (!visibleCategorySignature) {
      didInitializeExpandedCategories.current = false;
      setExpandedCategories((current) => current.size ? new Set() : current);
      return;
    }
    if (!didInitializeExpandedCategories.current) {
      setExpandedCategories(new Set([visibleCategorySignature.split("|")[0]]));
      didInitializeExpandedCategories.current = true;
    }
  }, [visibleCategorySignature]);

  const refetchMetrics = async () => {
    await Promise.all([trendsQuery.refetch(), trackedQuery.refetch()]);
  };

  const clearFilters = () => {
    setQuery("");
    setFlaggedOnly(false);
    setMemberId(api.activeMember?.id ?? "");
  };

  return (
    <div className="trends-workspace">
      <RootPageHeader
        title="Trends"
        subtitle={`${trackedQuery.data?.length ?? flatMetrics.length} tracked metrics for ${api.members.find((member) => member.id === memberId)?.display_name ?? "this profile"}.`}
        action={<button className="button button-secondary" type="button" disabled={!familyId || !memberId} onClick={() => setIsAddOpen(true)}>Add metrics</button>}
      />
      <ApiStatusBanner />

      <Card className="trends-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search trends" label="Search trends" />
        <label className="select-field trends-member-filter">
          <span className="sr-only">Member</span>
          <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            {api.members.length ? api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>) : <option value="">No profile selected</option>}
          </select>
        </label>
        <FilterChip icon="icon_review_required" active={flaggedOnly} tone="orange" onClick={() => setFlaggedOnly((value) => !value)}>
          Flagged {flaggedCount ? `(${flaggedCount})` : ""}
        </FilterChip>
        <FilterChip icon="icon_filter_clear" active={false} tone="gray" onClick={clearFilters}>Clear</FilterChip>
      </Card>

      <section className="trends-accordion">
        {trendsQuery.isLoading ? (
          <SkeletonCard />
        ) : filteredCategories.length ? (
          filteredCategories.map((category) => {
            const isOpen = expandedCategories.has(category.category);
            const categoryFlaggedCount = category.metrics.filter(flagged).length;
            return (
              <Card className="trend-category-section" key={category.category}>
                <button
                  className="trend-category-toggle"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setExpandedCategories((current) => {
                      const next = new Set(current);
                      if (next.has(category.category)) next.delete(category.category);
                      else next.add(category.category);
                      return next;
                    });
                  }}
                >
                  <IconBadge icon="icon_filter_metric" tone={categoryTone(category.category)} size={38} />
                  <span>
                    <strong>{category.display_name}</strong>
                    <small>{category.metrics.length} metrics</small>
                  </span>
                  {categoryFlaggedCount ? <StatusPill tone="orange">{categoryFlaggedCount} flagged</StatusPill> : <StatusPill tone="green">In range</StatusPill>}
                  <BioIcon className={`trend-category-chevron${isOpen ? " is-open" : ""}`} name="icon_action_continue" size={18} />
                </button>
                {isOpen ? (
                  <div className="trend-category-metrics">
                    {category.metrics.map((metric) => (
                      <TrendMetricRow
                        key={metric.canonical_metric_id}
                        metric={{ ...metric, categoryName: category.display_name }}
                      />
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })
        ) : (
          <EmptyState title={flaggedOnly ? "No flagged metrics" : "No tracked trends"} body={flaggedOnly ? "Clear filters to see all tracked metrics." : "Add a category and choose metrics to start tracking."} />
        )}
      </section>

      {isAddOpen && familyId && memberId ? (
        <AddMetricsModal
          familyId={familyId}
          memberId={memberId}
          categories={categoriesQuery.data?.categories ?? []}
          trackedMetricIds={trackedMetricIds}
          onClose={() => setIsAddOpen(false)}
          onChanged={refetchMetrics}
        />
      ) : null}
    </div>
  );
}

export function TrendDetailWorkspace({ metricId }: { metricId: string }) {
  const api = useKlarioApi();
  const [range, setRange] = useState<TrendRange>("all");
  const [detailTab, setDetailTab] = useState<"trend" | "history">("trend");
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const trendQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "trends", "detail", familyId, memberId, metricId, range),
    queryFn: () => trendsApi.detail(familyId!, memberId!, metricId, range),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && memberId && metricId),
    ...queryFreshness.workspace
  });

  const data = trendQuery.data;

  const points = data && "points" in data ? (data.points as any[]) : [];
  const rangeBand = referenceRange(data);
  const latest = data && "latest" in data ? data.latest : null;
  const summary = data && "summary" in data ? data.summary : null;

  const getChangeValue = () => {
    if (!summary || !("change_from_previous" in summary)) return "—";
    const change = summary.change_from_previous;
    if (change === null) return "—";
    const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
    return `${arrow} ${Math.abs(change)}${data?.unit ? ` ${data.unit}` : ""}`;
  };

  const getObservedRange = () => {
    if (!summary || !("minimum" in summary) || !("maximum" in summary)) return "—";
    if (summary.minimum === null || summary.maximum === null) return "—";
    return `${summary.minimum}–${summary.maximum}`;
  };

  const getDateRangeString = () => {
    if (points.length === 0) return "";
    const firstDate = formatDate(points[0].date).split(',')[0];
    const lastDate = formatDate(points[points.length - 1].date).split(',')[0];
    if (firstDate === lastDate) return firstDate;
    return `${firstDate} – ${lastDate}`;
  };

  const trendSummary = useMemo(() => {
    const values = points.map((point) => point.value).filter((value): value is number => value !== null);
    if (values.length < 2) return { label: "Trend unavailable", tone: "muted" };
    const change = values[values.length - 1] - values[0];
    if (change === 0) return { label: "Values remained stable", tone: "stable" };
    return change > 0
      ? { label: "Upward trend", tone: "attention" }
      : { label: "Downward trend", tone: "attention" };
  }, [points]);

  return (
    <div className="trend-detail-workspace" style={{ maxWidth: "1360px", padding: "0 24px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
      <ApiStatusBanner />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "6px" }}>
            {data?.display_name ?? prettyStatus(metricId)}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
            {summary?.reading_count ? `${summary.reading_count} readings · ${getDateRangeString()}` : "No readings yet"}
          </p>
        </div>
        <Link className="button button-ghost" href="/app/trends" style={{ flexShrink: 0 }}>
          Back to all trends
        </Link>
      </div>

      {data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* LATEST VALUE + STATUS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Latest result</span>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "24px", fontWeight: "700", color: latest?.flag ? `var(--status-${toneForStatus(latest.flag)}-text, var(--text-primary))` : "var(--text-primary)" }}>
                {latest ? valueWithUnit(latest.value, latest.unit) : "—"}
              </span>
              {latest?.flag && (
                <StatusPill tone={toneForStatus(latest.flag)}>
                  {prettyStatus(latest.flag)}
                </StatusPill>
              )}
            </div>
          </div>

          {/* TIME RANGE */}
          <div style={{ width: "fit-content", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-full)", padding: "4px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {rangeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setRange(option)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: range === option ? "var(--bg-muted)" : "transparent",
                    color: range === option ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: range === option ? "600" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {option === "6m" ? "6M" : option === "all" ? "All" : prettyStatus(option)}
                </button>
              ))}
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <Card style={{ padding: "0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px", padding: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Latest</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>{latest ? valueWithUnit(latest.value, latest.unit) : "—"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Readings</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>{summary?.reading_count ?? 0}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Average</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>
                  {summary && "average" in summary && summary.average !== null ? valueWithUnit(summary.average, data.unit) : "—"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Range</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>{getObservedRange()}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Change</span>
                <span style={{ fontSize: "16px", fontWeight: "600", color: summary && "change_from_previous" in summary && summary.change_from_previous ? "var(--status-orange-text)" : "var(--text-primary)" }}>
                  {getChangeValue()}
                </span>
              </div>
            </div>
            <div className="trend-summary-context">
              <span><BioIcon name="icon_filter_metric" size={14} /> {"category" in data ? data.category : "Health metric"}</span>
              <span>{summary?.reading_count === 1 ? "1 reading" : `${summary?.reading_count ?? 0} readings`}</span>
              {latest?.flag ? <StatusPill tone={toneForStatus(latest.flag)} fill="tinted">{prettyStatus(latest.flag)}</StatusPill> : null}
            </div>
          </Card>

          <Card className="trend-detail-content-card">
            <div className="trend-detail-tabs" role="tablist" aria-label="Metric detail content">
              <button className={detailTab === "trend" ? "is-active" : ""} type="button" role="tab" aria-selected={detailTab === "trend"} onClick={() => setDetailTab("trend")}>Trend</button>
              <button className={detailTab === "history" ? "is-active" : ""} type="button" role="tab" aria-selected={detailTab === "history"} onClick={() => setDetailTab("history")}>History <span>{points.length}</span></button>
            </div>
            {detailTab === "trend" ? (
              <div className="trend-detail-tab-panel" role="tabpanel">
                <div className="trend-chart-heading">
                  <div>
                    <h2>Trend</h2>
                    <p className={`trend-direction is-${trendSummary.tone}`}>{trendSummary.label}</p>
                  </div>
                  <span className="trend-period-label">{getDateRangeString()}</span>
                </div>
                <InteractiveTrendChart points={points} referenceMin={rangeBand?.min ?? null} referenceMax={rangeBand?.max ?? null} unit={data.unit} />
                <div className="trend-chart-legend">
                  <span><i className="is-reading" /> Reading</span>
                  {rangeBand ? <span><i className="is-reference" /> Reference range</span> : null}
                </div>
                {data.unit_warning ? <p className="form-alert">{data.unit_warning}</p> : null}
              </div>
            ) : (
              <div className="trend-history-panel" role="tabpanel">
                {points.length ? [...points].reverse().map((point) => (
                  <Link className="trend-history-row" href={`/app/reports/${point.document_id}`} key={point.id}>
                    <i className={point.flag && point.flag !== "normal" ? "is-out-of-range" : ""} />
                    <span>{formatDate(point.date)}</span>
                    <strong>{valueWithUnit(point.value, point.unit ?? data.unit)}</strong>
                    {point.flag ? <StatusPill tone={toneForStatus(point.flag)} fill="tinted">{prettyStatus(point.flag)}</StatusPill> : <StatusPill tone="gray">Unknown</StatusPill>}
                    <BioIcon name="icon_action_continue" size={16} />
                  </Link>
                )) : <EmptyState title="No history yet" body="Imported report readings will appear here." />}
              </div>
            )}
          </Card>

          {/* REFERENCE RANGE & SOURCE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", maxWidth: "600px" }}>
            <Card style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>Reference range</h3>
              {rangeBand ? (
                <>
                  <div style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                    {rangeBand.min ?? "—"}–{rangeBand.max ?? "—"} {data.unit}
                  </div>
                  <ReferenceRangeScale minimum={rangeBand.min} maximum={rangeBand.max} value={latest?.value} unit={data.unit} />
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <StatusPill tone={latest?.flag ? toneForStatus(latest.flag) : "gray"}>
                      {latest?.flag ? prettyStatus(latest.flag) : "Unknown"}
                    </StatusPill>
                    {latest && (
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                        Your latest reading: {latest.value} {data.unit}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Reference range unavailable
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState title="No metric data" body="Sign in and select a member with parsed reports to see this trend." />
        </Card>
      )}
    </div>
  );
}
