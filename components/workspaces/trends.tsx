"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { MetricCatalogItem, MetricCategory, TrendCategoryGroup, TrendMetricPreview, TrendRange } from "@/lib/api/types";
import { toneForLabFlag, toneForStatus, type BioStatusTone } from "@/lib/tone";
import { ApiStatusBanner, EmptyState, Sparkline, formatDate, prettyStatus, statusClass, valueWithUnit } from "@/components/workspaces/shared";

const rangeOptions: TrendRange[] = ["week", "month", "6m", "year", "all"];

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
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!categoryId && categories.length) {
      setCategoryId(categories[0].category_id);
    }
  }, [categories, categoryId]);

  const catalogQuery = useQuery({
    queryKey: ["metrics", "catalog", categoryId, query],
    queryFn: () => metricsApi.catalog({ category_id: categoryId || undefined, search: query || undefined }),
    enabled: Boolean(memberId)
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
    queryKey: ["trends", "list", familyId, memberId],
    queryFn: () => trendsApi.list(familyId!, memberId),
    enabled: api.status === "live" && Boolean(familyId && memberId)
  });
  const trackedQuery = useQuery({
    queryKey: ["metrics", "tracked", familyId, memberId],
    queryFn: () => metricsApi.tracked(familyId!, memberId),
    enabled: api.status === "live" && Boolean(familyId && memberId)
  });
  const categoriesQuery = useQuery({
    queryKey: ["metrics", "categories"],
    queryFn: () => metricsApi.categories({ active_only: true }),
    enabled: api.status === "live"
  });

  const categories = trendsQuery.data?.categories ?? [];
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
  const trackedMetricIds = useMemo(() => new Set((trackedQuery.data ?? []).map((metric) => metric.canonical_metric_id)), [trackedQuery.data]);
  const flaggedCount = flatMetrics.filter(flagged).length;

  useEffect(() => {
    if (!filteredCategories.length) {
      didInitializeExpandedCategories.current = false;
      setExpandedCategories(new Set());
      return;
    }
    if (!didInitializeExpandedCategories.current) {
      setExpandedCategories(new Set([filteredCategories[0].category]));
      didInitializeExpandedCategories.current = true;
    }
  }, [filteredCategories]);

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
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const trendQuery = useQuery({
    queryKey: ["trends", "detail", familyId, memberId, metricId, range],
    queryFn: () => trendsApi.detail(familyId!, memberId!, metricId, range),
    enabled: api.status === "live" && Boolean(familyId && memberId && metricId)
  });

  const data = trendQuery.data;
  const points = pointValues(data);
  const rangeBand = referenceRange(data);
  const latest = data && "latest" in data ? data.latest : null;
  const summary = data && "summary" in data ? data.summary : null;

  return (
    <div className="trend-detail-workspace">
      <RootPageHeader
        title={data?.display_name ?? prettyStatus(metricId)}
        subtitle={data && "category" in data ? `${data.category} trend for ${api.activeMember?.display_name ?? "this profile"}.` : "Metric detail from the backend trends API."}
        action={<Link className="button button-ghost" href="/app/trends">All trends</Link>}
      />
      <ApiStatusBanner />

      <Card className="trend-detail-toolbar">
        <div className="filter-group" aria-label="Trend range">
          {rangeOptions.map((option) => (
            <FilterChip key={option} active={range === option} tone="brand" onClick={() => setRange(option)}>
              {option === "6m" ? "6M" : prettyStatus(option)}
            </FilterChip>
          ))}
        </div>
      </Card>

      <section className="trend-detail-grid">
        <Card className="trend-chart-detail-card">
          <KlarioSectionHeader
            title={data?.display_name ?? "Trend chart"}
            subtitle={latest ? `Latest ${formatDate(latest.date)}` : "No latest reading yet."}
          />
          {data ? (
            <>
              <div className="trend-detail-hero">
                <IconBadge icon="icon_filter_metric" tone={latest ? toneForLabFlag(latest.flag) : "gray"} size={44} />
                <strong>{latest ? valueWithUnit(latest.value, latest.unit) : valueWithUnit(null, data.unit)}</strong>
                {latest?.flag ? <StatusPill tone={toneForLabFlag(latest.flag)}>{prettyStatus(latest.flag)}</StatusPill> : <StatusPill tone="gray">Range unavailable</StatusPill>}
              </div>
              <div className="trend-chart-frame is-detail">
                {rangeBand ? (
                  <div className="trend-reference-band" aria-hidden="true">
                    <span>Reference range</span>
                  </div>
                ) : null}
                <Sparkline points={points} />
                <div className="trend-axis-row">
                  <span>{data.range ? prettyStatus(data.range) : "Range"}</span>
                  <span>{points.length} points</span>
                </div>
              </div>
              {data.unit_warning ? <p className="form-alert">{data.unit_warning}</p> : null}
            </>
          ) : (
            <EmptyState title="No metric data" body="Sign in and select a member with parsed reports to see this trend." />
          )}
        </Card>

        <Card className="trend-reference-card">
          <KlarioSectionHeader title="Reference range" subtitle="Report-supplied range when available." />
          {rangeBand ? (
            <>
              <div className="trend-reference-scale">
                <span>{rangeBand.min}</span>
                <span>{rangeBand.max}</span>
              </div>
              <StatusPill tone={latest?.flag ? toneForStatus(latest.flag) : "green"}>{latest?.flag ? prettyStatus(latest.flag) : "In range"}</StatusPill>
            </>
          ) : (
            <EmptyState title="No reference range" body="Reference ranges appear when reports provide validated lower and upper bounds." />
          )}
        </Card>

        <Card className="trend-reference-card">
          <KlarioSectionHeader title="Summary" subtitle="Readings in the selected range." />
          {summary ? (
            <div className="trend-summary-list">
              <span><strong>{summary.reading_count}</strong> readings</span>
              {"average" in summary ? <span><strong>{summary.average ?? "n/a"}</strong> average</span> : null}
              {"minimum" in summary ? <span><strong>{summary.minimum ?? "n/a"}</strong> minimum</span> : null}
              {"maximum" in summary ? <span><strong>{summary.maximum ?? "n/a"}</strong> maximum</span> : null}
            </div>
          ) : (
            <EmptyState title="No summary" body="Summary values appear after parsed readings are available." />
          )}
        </Card>
      </section>
    </div>
  );
}
