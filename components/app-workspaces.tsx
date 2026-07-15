"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PageTitle, SectionHeader } from "@/components/section";
import {
  attentionApi,
  canManageInvites,
  canManageMembers,
  canManageRoles,
  canResolveAttention,
  canUpload,
  dashboardApi,
  documentsApi,
  familiesApi,
  healthApi,
  invitesApi,
  inviteRoleOptions,
  membersApi,
  parseApi,
  trendsApi
} from "@/lib/api/klario-api";
import { uploadAndParseReport, validateReportFile, type UploadStatusUpdate } from "@/lib/api/upload";
import type {
  AttentionItemStatus,
  Document as KlarioDocument,
  DocumentType,
  FamilyInvite,
  FamilyRoleType,
  MemberAttentionItem,
  ParsedResult,
  TrendMetricPreview
} from "@/lib/api/types";

export function DashboardWorkspace() {
  const api = useKlarioApi();
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const hasLiveContext = api.status === "live" && Boolean(familyId && memberId);

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
  const primaryMetric = metrics[0];
  const supportingMetrics = metrics.slice(1);
  const latestReport = dashboard?.latest_reports[0] ?? null;
  const lastTest = dashboard?.health_summary.last_report
    ? `Last test - ${dashboard.health_summary.last_report.title}, ${formatDate(dashboard.health_summary.last_report.date)}`
    : "Last test - upload a report to begin";

  return (
    <div className="dashboard-one-screen">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <h1>{dashboard?.health_summary.status_sentence ?? "Your health workspace is ready"}</h1>
          <p>{dashboard?.health_summary.score_note ?? `Your health overview for ${activeLabel}. Upload a report to populate summaries.`}</p>
          <div className="dashboard-actions">
            <Link className="button button-primary" href="/app/upload">
              <BioIcon name="icon_doc_add_empty" size={17} />
              Upload report
            </Link>
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
          score={primaryMetric.value}
          note={primaryMetric.body}
          metrics={supportingMetrics}
        />
      </section>

      <ApiStatusBanner />

      <div className="dashboard-profile-row">
        <div className="dashboard-profile-context">
          <span className="control-label">Active profile</span>
          <strong>{activeLabel}</strong>
          {api.activeFamily ? <span className="note">{api.activeFamily.name}</span> : null}
        </div>
        {api.members.length ? (
          <div className="profile-pills" role="list" aria-label="Family profiles">
            {api.members.map((member) => (
              <button
                key={member.id}
                className={`pill-button${api.activeMember?.id === member.id ? " is-active" : ""}`}
                type="button"
                onClick={() => api.setActiveMemberId(member.id)}
              >
                {member.display_name}
              </button>
            ))}
          </div>
        ) : (
          <p className="note">Your account includes a default family profile after signup.</p>
        )}
      </div>

      <section className="dashboard-metrics" aria-label="Workspace summary">
        {supportingMetrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-number">{metric.value}</span>
            <h3>{metric.label}</h3>
            <p>{metric.body}</p>
          </article>
        ))}
      </section>

      {dashboard ? (
        <section className="dashboard-panel dashboard-review-panel">
          <div>
            <div className="dashboard-panel-head">
              <div>
                <span className="control-label">Review queue</span>
                <h2>Needs attention</h2>
                <p>{dashboard.needs_attention.length ? `${dashboard.needs_attention.length} items need review.` : "No review items right now."}</p>
              </div>
              <Link className="button button-secondary" href="/app/attention">Review all</Link>
            </div>
            <div className="record-list compact">
              {dashboard.needs_attention.length ? (
                dashboard.needs_attention.slice(0, 3).map((item) => (
                  <article className="record record-with-action" key={item.id}>
                    <div>
                      <div className="record-meta">
                        <span>{formatDate(item.created_at)}</span>
                        {item.flag ? <span className={statusClass(item.flag)}>{prettyStatus(item.flag)}</span> : null}
                      </div>
                      <h3>{item.display_name ?? prettyStatus(item.reason_code)}</h3>
                      <p>{item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ""}. ` : ""}{prettyStatus(item.reason_code)}</p>
                    </div>
                    <Link className="button button-secondary" href="/app/attention">Review</Link>
                  </article>
                ))
              ) : (
                <EmptyState title="No attention items" body="New parsed reports will appear here when they need review." />
              )}
            </div>
          </div>

          <aside className="dashboard-latest-report">
            <span className="control-label">Latest report</span>
            {latestReport ? (
              <>
                <div className="record-meta">
                  <span>{formatDate(latestReport.created_at)}</span>
                  <span className={statusClass(latestReport.status)}>{prettyStatus(latestReport.status)}</span>
                </div>
                <h3>{latestReport.title}</h3>
                <p>{prettyStatus(latestReport.document_type)}. {latestReport.parsed_count} parsed results, {latestReport.attention_count} attention items.</p>
                <div className="button-row compact">
                  <Link className="button button-primary" href={`/app/reports/${latestReport.document_id}`}>Open report</Link>
                  <Link className="button button-ghost" href="/app/documents">All reports</Link>
                </div>
              </>
            ) : (
              <>
                <h3>No reports yet</h3>
                <p>Upload a report to start building the member record.</p>
                <div className="button-row compact">
                  <Link className="button button-primary" href="/app/upload">Upload report</Link>
                </div>
              </>
            )}
          </aside>
        </section>
      ) : (
        <EmptyState
          title="Your workspace is ready"
          body="Upload your first report to populate trends, attention items, and health summaries."
          actionLabel="Upload report"
          actionHref="/app/upload"
        />
      )}

      <p className="note app-disclaimer">Based on imported reports and available reference ranges. Not a diagnosis.</p>
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
        <span className="status-chip is-success">Updated</span>
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
export function DocumentsWorkspace() {
  const api = useKlarioApi();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const familyId = api.activeFamily?.id;
  const liveDocumentsQuery = useQuery({
    queryKey: ["documents", "list", familyId],
    queryFn: () => documentsApi.list(familyId!),
    enabled: api.status === "live" && Boolean(familyId)
  });

  const liveDocuments = liveDocumentsQuery.data ?? null;
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(documentId),
    onSuccess: () => api.invalidateWorkspaceData()
  });
  const statusOptions = liveDocuments
    ? ["All", ...Array.from(new Set(liveDocuments.map((document) => document.status)))]
    : ["All"];

  const filteredLiveDocuments = useMemo(() => {
    if (!liveDocuments) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return liveDocuments.filter((document) => {
      const matchesStatus = status === "All" || document.status === status;
      const haystack = `${document.title} ${document.original_filename} ${document.document_type} ${document.status}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [liveDocuments, query, status]);
  const reportCountLabel = liveDocuments ? `${filteredLiveDocuments.length} of ${liveDocuments.length} reports` : "Reports";

  return (
    <div className="flat-workspace reports-workspace">
      <div className="flat-workspace-head">
        <div>
          <h1>Uploaded reports</h1>
          <p>{reportCountLabel} for {api.activeFamily?.name ?? "the current workspace"}.</p>
        </div>
        <Link className="button button-primary" href="/app/upload">
          <BioIcon name="icon_doc_add_empty" size={17} />
          Upload report
        </Link>
      </div>
      <ApiStatusBanner />
      <div className="workspace-bar">
        <label className="search-field">
          <span className="sr-only">Search reports</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports" />
        </label>
        <div className="filter-group" aria-label="Filter reports">
          {statusOptions.map((option) => (
            <button key={option} className={`pill-button${status === option ? " is-active" : ""}`} type="button" onClick={() => setStatus(option)}>
              {prettyStatus(option)}
            </button>
          ))}
        </div>
      </div>

      <section className="record-list">
        {liveDocumentsQuery.isLoading ? (
          <EmptyState title="Loading reports" body="Fetching your uploaded documents." />
        ) : liveDocuments ? (
          filteredLiveDocuments.length ? (
            filteredLiveDocuments.map((document) => (
              <DocumentRecord
                key={document.id}
                document={document}
                deleting={deleteDocumentMutation.variables === document.id && deleteDocumentMutation.isPending}
                onDelete={(documentId) => deleteDocumentMutation.mutate(documentId)}
              />
            ))
          ) : (
            <EmptyState title="No reports found" body="Try a different search or upload a report." />
          )
        ) : (
          <EmptyState title="No family selected" body="Create a family and upload your first report." />
        )}
      </section>
    </div>
  );
}

export function UploadWorkspace() {
  const api = useKlarioApi();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("lab_report");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadAllowed = canUpload(api.currentRole);

  useEffect(() => {
    if (api.activeMember?.id) {
      setSelectedMemberId(api.activeMember.id);
    }
  }, [api.activeMember?.id]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileName(file?.name ?? "");
    setStatusMessage("");

    if (file) {
      try {
        validateReportFile(file);
      } catch (validationError) {
        setStatusMessage(validationError instanceof Error ? validationError.message : "This file is not supported.");
      }
    }
  };

  const onMemberChange = (memberId: string) => {
    setSelectedMemberId(memberId);
    api.setActiveMemberId(memberId);
  };

  const startParsing = async () => {
    if (!selectedFile) {
      setStatusMessage("Choose a supported report file first.");
      return;
    }

    if (!api.activeFamily?.id || !selectedMemberId) {
      setStatusMessage("Sign in and select a family member before uploading.");
      return;
    }

    if (!uploadAllowed) {
      setStatusMessage("You don't have permission to upload reports.");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Starting upload");

    try {
      await uploadAndParseReport({
        familyId: api.activeFamily.id,
        memberId: selectedMemberId,
        file: selectedFile,
        title,
        documentType,
        onStatus: (update: UploadStatusUpdate) => setStatusMessage(update.message)
      });
      setStatusMessage("Report processed. Dashboard, reports, trends, and attention lists will refresh.");
      setSelectedFile(null);
      setFileName("");
      await api.invalidateWorkspaceData();
    } catch (uploadError) {
      setStatusMessage(uploadError instanceof Error ? uploadError.message : "Upload could not be completed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flat-workspace upload-workspace">
      <div className="flat-workspace-head">
        <div>
          <h1>Upload report</h1>
          <p>Add one medical file and assign it to a profile.</p>
        </div>
      </div>
      <ApiStatusBanner />

      <section className="upload-layout">
        <aside className="flat-panel upload-panel">
          {!uploadAllowed ? <p className="form-alert">Viewer access cannot upload reports.</p> : null}
          <div className="upload-form-grid">
            <div className="upload-fields">
              <h2>Report details</h2>
              <label className="select-field">
                <span className="control-label">Profile</span>
                {api.members.length ? (
                  <select value={selectedMemberId} onChange={(event) => onMemberChange(event.target.value)}>
                    {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                  </select>
                ) : (
                  <p className="note">Add a family member before uploading.</p>
                )}
              </label>
              <label>
                <span className="control-label">Report title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={fileName || "CBC, ferritin, prescription..."} />
              </label>
              <label className="select-field">
                <span className="control-label">Document type</span>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)}>
                  {documentTypes.map((type) => <option key={type} value={type}>{prettyStatus(type)}</option>)}
                </select>
              </label>
            </div>
            <div className="upload-file-column">
              <div>
                <h2>Report file</h2>
                <p>PDF or image up to 25 MB.</p>
              </div>
              <label className="drop-zone">
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif" onChange={onFileChange} />
                <span>{fileName || "Choose PDF, JPEG, PNG, HEIC, or HEIF"}</span>
              </label>
              <button className="button button-primary" type="button" disabled={isUploading || !selectedFile || !uploadAllowed || !selectedMemberId} onClick={startParsing}>
                <BioIcon name={isUploading ? "icon_action_loading" : "icon_action_confirm_safe"} size={17} />
                {isUploading ? "Analyzing" : "Analyze report"}
              </button>
              {statusMessage ? <p className={statusMessage.includes("permission") || statusMessage.includes("supported") ? "form-alert" : "note"}>{statusMessage}</p> : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export function TimelineWorkspace() {
  const api = useKlarioApi();
  const familyId = api.activeFamily?.id;
  const documentsQuery = useQuery({
    queryKey: ["documents", "timeline", familyId],
    queryFn: () => documentsApi.list(familyId!),
    enabled: api.status === "live" && Boolean(familyId)
  });

  const liveEvents = (documentsQuery.data ?? [])
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((document) => ({
      date: formatDate(document.created_at),
      title: document.title,
      body: `${prettyStatus(document.document_type)}. ${prettyStatus(document.status)}.`
    }));

  return (
    <>
      <PageTitle title="Timeline" body={`Longitudinal health history for ${api.activeMember?.display_name ?? "your profile"}.`} />
      <ApiStatusBanner />
      <section className="timeline-list">
        {liveEvents.length ? (
          liveEvents.map((event) => (
            <article className="timeline-item" key={`${event.date}-${event.title}`}>
              <span>{event.date}</span>
              <h3>{event.title}</h3>
              <p>{event.body}</p>
            </article>
          ))
        ) : (
          <EmptyState title="No timeline events yet" body="Uploaded reports will appear here in chronological order." />
        )}
      </section>
    </>
  );
}

export function TrendsWorkspace() {
  const api = useKlarioApi();
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const trendsQuery = useQuery({
    queryKey: ["trends", "list", familyId, memberId],
    queryFn: () => trendsApi.list(familyId!, memberId!),
    enabled: api.status === "live" && Boolean(familyId && memberId)
  });

  const apiMetrics = useMemo(
    () => trendsQuery.data?.categories.flatMap((category) => category.metrics.map((metric) => ({ ...metric, category: category.display_name }))) ?? [],
    [trendsQuery.data]
  );
  const [activeMetricId, setActiveMetricId] = useState("");

  useEffect(() => {
    if (apiMetrics.length && !apiMetrics.some((metric) => metric.canonical_metric_id === activeMetricId)) {
      setActiveMetricId(apiMetrics[0].canonical_metric_id);
    }
  }, [activeMetricId, apiMetrics]);

  const activeMetric = apiMetrics.find((metric) => metric.canonical_metric_id === activeMetricId) ?? apiMetrics[0];

  return (
    <div className="flat-workspace trends-workspace">
      <div className="flat-workspace-head">
        <div>
          <h1>Biomarker trends</h1>
          <p>{apiMetrics.length ? `${apiMetrics.length} tracked metrics` : "Trends"} for {api.activeMember?.display_name ?? "your profile"}.</p>
        </div>
      </div>
      <ApiStatusBanner />
      <section className="trends-layout">
        {activeMetric ? (
          <>
            <div className="flat-panel trend-detail">
              <div className="record-meta">
                {activeMetric.latest_flag ? <span className={statusClass(activeMetric.latest_flag)}>{prettyStatus(activeMetric.latest_flag)}</span> : null}
                <span>{activeMetric.reading_count} readings</span>
              </div>
              <div className="trend-detail-head">
                <div>
                  <h2>{activeMetric.display_name}</h2>
              <p>{activeMetric.category} · Latest {activeMetric.latest_date ? formatDate(activeMetric.latest_date) : "not dated"}</p>
                </div>
                <p className="trend-value">{valueWithUnit(activeMetric.latest_value, activeMetric.unit)}</p>
              </div>
              <div className="trend-chart-panel">
                <Sparkline points={activeMetric.sparkline.map((point) => point.value)} />
              </div>
              <Link className="button button-secondary" href={`/app/trends/${activeMetric.canonical_metric_id}`}>Open metric detail</Link>
            </div>
            <aside className="flat-panel trend-library">
              <div className="trend-library-head">
                <h2>All biomarkers</h2>
                <span className="status-chip is-info">{apiMetrics.length} metrics</span>
              </div>
              <div className="trend-card-grid">
                {apiMetrics.map((metric) => <TrendMetricCard key={metric.canonical_metric_id} metric={metric} active={activeMetric.canonical_metric_id === metric.canonical_metric_id} onSelect={() => setActiveMetricId(metric.canonical_metric_id)} />)}
              </div>
            </aside>
          </>
        ) : (
          <EmptyState title="No trend data yet" body="Upload and parse lab reports to see biomarker trends." />
        )}
      </section>
    </div>
  );
}

export function TrendDetailWorkspace({ metricId }: { metricId: string }) {
  const api = useKlarioApi();
  const [range, setRange] = useState<"week" | "month" | "6m" | "year" | "all">("all");
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const trendQuery = useQuery({
    queryKey: ["trends", "detail", familyId, memberId, metricId, range],
    queryFn: () => trendsApi.detail(familyId!, memberId!, metricId, range),
    enabled: api.status === "live" && Boolean(familyId && memberId && metricId)
  });

  const points = trendQuery.data && "points" in trendQuery.data
    ? trendQuery.data.points.map((point) => ("value" in point ? point.value ?? 0 : point.systolic))
    : [];

  return (
    <>
      <PageTitle title={trendQuery.data?.display_name ?? prettyStatus(metricId)} body="Metric detail from the backend trends API." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <div className="filter-group" aria-label="Trend range">
          {(["week", "month", "6m", "year", "all"] as const).map((option) => (
            <button key={option} className={`pill-button${range === option ? " is-active" : ""}`} type="button" onClick={() => setRange(option)}>
              {option}
            </button>
          ))}
        </div>
        <Link className="button button-secondary" href="/app/trends">All trends</Link>
      </div>
      <section className="interactive-panel trend-detail">
        {trendQuery.data ? (
          <>
            <h2>{trendQuery.data.display_name}</h2>
            <Sparkline points={points} />
            {"summary" in trendQuery.data ? <p>{trendQuery.data.summary.reading_count} readings in this range.</p> : null}
            {trendQuery.data.unit_warning ? <p className="form-alert">{trendQuery.data.unit_warning}</p> : null}
          </>
        ) : (
          <EmptyState title="No metric data" body="Sign in and select a member with parsed reports to see this trend." />
        )}
      </section>
    </>
  );
}

export function FamilyWorkspace() {
  const api = useKlarioApi();
  const [familyName, setFamilyName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const memberCreateAllowed = canManageMembers(api.currentRole);
  const memberManageAllowed = canManageMembers(api.currentRole);
  const familyManageAllowed = canManageRoles(api.currentRole);
  const deleteMemberMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.delete(memberId),
    onSuccess: async () => {
      setMessage("Family member removed.");
      if (api.activeFamily?.id) {
        await api.setActiveFamilyId(api.activeFamily.id);
      }
      await api.invalidateWorkspaceData();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Family member could not be removed.")
  });
  const deleteFamilyMutation = useMutation({
    mutationFn: (familyId: string) => familiesApi.delete(familyId),
    onSuccess: async () => {
      setMessage("Family removed.");
      await api.refresh();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Family could not be removed.")
  });

  const createFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.createFamily({ name: familyName });
      setFamilyName("");
      setMessage("Family created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Family could not be created.");
    }
  };

  const createMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!api.activeFamily?.id) return;
    setMessage("");
    try {
      await api.createMember(api.activeFamily.id, { display_name: memberName, relationship });
      setMemberName("");
      setRelationship("");
      setMessage("Family member created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Family member could not be created.");
    }
  };

  return (
    <div className="flat-workspace family-workspace">
      <div className="flat-workspace-head">
        <div>
          <h1>Family</h1>
          <p>{api.members.length} profiles - {api.currentRole ? `${prettyStatus(api.currentRole)} role` : "No role selected"}.</p>
        </div>
      </div>
      <ApiStatusBanner />
      <div className="family-command-card">
        <div>
          <span className="control-label">Current workspace</span>
          <h2>{api.activeFamily?.name ?? "No family selected"}</h2>
          <p>{api.members.length} profiles connected to this family.</p>
        </div>
        <div className="family-command-actions">
          {api.families.length ? (
            <label className="select-field">
              <span className="control-label">Switch family</span>
              <select value={api.activeFamily?.id ?? ""} onChange={(event) => void api.setActiveFamilyId(event.target.value)}>
                {api.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
              </select>
            </label>
          ) : null}
          {api.activeFamily && familyManageAllowed ? (
            <button
              className="button button-ghost danger-action"
              type="button"
              disabled={deleteFamilyMutation.isPending}
              onClick={() => {
                if (window.confirm(`Delete ${api.activeFamily?.name}? This cannot be undone.`)) {
                  deleteFamilyMutation.mutate(api.activeFamily!.id);
                }
              }}
            >
              {deleteFamilyMutation.isPending ? "Deleting" : "Delete family"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="family-main-grid">
        <div className="family-members-section">
          <div className="dashboard-panel-head">
            <div>
              <h2>Profiles</h2>
              <p>Choose the person you want to view across reports and trends.</p>
            </div>
          </div>
          <div className="family-member-grid">
            {api.members.length ? (
              api.members.map((member) => (
                <button key={member.id} className={`profile-card flat-panel${api.activeMember?.id === member.id ? " is-active" : ""}`} type="button" onClick={() => api.setActiveMemberId(member.id)}>
                  <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
                  <h3>{member.display_name}</h3>
                  <p>{[member.relationship, member.sex ? prettyStatus(member.sex) : "", member.date_of_birth ? `Born ${formatDate(member.date_of_birth)}` : ""].filter(Boolean).join(" - ")}</p>
                  {memberManageAllowed ? (
                    <span className="button-row compact">
                      <span className="inline-action">Select</span>
                      <span
                        className="inline-action danger-text"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (window.confirm(`Delete ${member.display_name}? Reports assigned to this member may be affected.`)) {
                            deleteMemberMutation.mutate(member.id);
                          }
                        }}
                      >
                        {deleteMemberMutation.variables === member.id && deleteMemberMutation.isPending ? "Deleting" : "Delete"}
                      </span>
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <EmptyState title="No members yet" body="Add a family member to assign reports and trends." />
            )}
          </div>
        </div>

        <div className="family-side-stack">
          <div className="family-panel-head">
            <h2>Manage family</h2>
            <p>Add a profile or create another workspace.</p>
          </div>
          <form className="family-quick-form" onSubmit={createMember}>
            <h3>Add member</h3>
            <input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Display name" required />
            <input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Relationship" required />
            <button className="button button-secondary" type="submit" disabled={!api.activeFamily || !memberCreateAllowed}>Add</button>
          </form>
          <form className="family-quick-form is-muted" onSubmit={createFamily}>
            <h3>Create family</h3>
            <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Family name" required />
            <button className="button button-secondary" type="submit" disabled={!api.isSignedIn}>Create</button>
          </form>
        </div>
      </section>

      {message ? <p className="note">{message}</p> : null}
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

export function InvitesWorkspace() {
  const api = useKlarioApi();
  const [email, setEmail] = useState("");
  const roleOptions = inviteRoleOptions(api.currentRole);
  const [role, setRole] = useState<Exclude<FamilyRoleType, "owner">>("viewer");
  const [message, setMessage] = useState("");
  const familyId = api.activeFamily?.id;
  const invitesAllowed = canManageInvites(api.currentRole);

  useEffect(() => {
    if (roleOptions.length && !roleOptions.includes(role)) {
      setRole(roleOptions[0]);
    }
  }, [role, roleOptions]);

  const invitesQuery = useQuery({
    queryKey: ["invites", "list", familyId],
    queryFn: () => invitesApi.list(familyId!),
    enabled: api.status === "live" && Boolean(familyId) && invitesAllowed
  });

  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!familyId) return;
    setMessage("");
    try {
      await invitesApi.create(familyId, { email, role, expires_in_days: 7 });
      setEmail("");
      setMessage("Invite created. Any dev-only invite token returned by the backend is intentionally hidden.");
      await api.invalidateWorkspaceData();
      await invitesQuery.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite could not be created.");
    }
  };

  const actOnInvite = async (invite: FamilyInvite, action: "resend" | "revoke") => {
    setMessage("");
    try {
      if (action === "resend") {
        await invitesApi.resend(invite.id);
        setMessage("Invite resent.");
      } else {
        await invitesApi.revoke(invite.id);
        setMessage("Invite revoked.");
      }
      await api.invalidateWorkspaceData();
      await invitesQuery.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite action failed.");
    }
  };

  return (
    <>
      <PageTitle title="Invites" body="Send, resend, and revoke family workspace invites." />
      <ApiStatusBanner />
      <section className="grid two-column-grid">
        <form className="card preference-card" onSubmit={createInvite}>
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_add" size={24} /></span>
          <h3>Create invite</h3>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" required />
          <select value={role} onChange={(event) => setRole(event.target.value as Exclude<FamilyRoleType, "owner">)}>
            {(roleOptions.length ? roleOptions : ["viewer"]).map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
          </select>
          <button className="button button-primary" type="submit" disabled={!invitesAllowed || !familyId}>Send invite</button>
          <p className="note">Owners can invite admins, contributors, and viewers. Admins can invite contributors and viewers.</p>
        </form>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={24} /></span>
          <h3>Permissions</h3>
          <p>{invitesAllowed ? "You can manage invites for this family." : "Your role cannot manage invites."}</p>
          <Link className="inline-action" href="/invite">Open invite accept page</Link>
        </article>
      </section>

      <section className="record-list">
        {invitesQuery.data ? (
          invitesQuery.data.length ? (
            invitesQuery.data.map((invite) => (
              <article className="record document-record" key={invite.id}>
                <div className="record-meta">
                  <span>{invite.invited_email}</span>
                  <span className={statusClass(invite.status)}>{prettyStatus(invite.status)}</span>
                  <span>{prettyStatus(invite.email_delivery_status)}</span>
                </div>
                <h3>{prettyStatus(invite.role)} invite</h3>
                <p>Expires {formatDate(invite.expires_at)}. Created {formatDate(invite.created_at)}.</p>
                <div className="button-row compact">
                  <button className="button button-secondary" type="button" disabled={invite.status !== "pending"} onClick={() => void actOnInvite(invite, "resend")}>Resend</button>
                  <button className="button button-ghost" type="button" disabled={invite.status !== "pending"} onClick={() => void actOnInvite(invite, "revoke")}>Revoke</button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No invites" body="Pending family invites will appear here." />
          )
        ) : (
          <EmptyState title="Invites need a live family" body="Sign in as an owner or admin to manage invites." />
        )}
      </section>
      {message ? <p className="note">{message}</p> : null}
    </>
  );
}

export function AccountWorkspace() {
  const api = useKlarioApi();
  const pendingInvitesQuery = useQuery({
    queryKey: ["invites", "mine"],
    queryFn: invitesApi.mine,
    enabled: api.status === "live"
  });

  return (
    <>
      <PageTitle title="Profile" body="Account controls, privacy settings, and workspace details." />
      <ApiStatusBanner />
      <section className="grid two-column-grid">
        <PreferenceCard icon="icon_signal_confidence" title="Account" body={api.user ? api.user.email : "Sign in to connect your account."} action="Open settings" href="/app/settings" />
        <PreferenceCard icon="icon_action_confirm_safe" title="Privacy" body="Records stay private and are not shared without consent." action="Review privacy" />
        <PreferenceCard icon="icon_tab_family" title="Family workspace" body={api.activeFamily ? api.activeFamily.name : "Choose the active family member for uploads and trends."} action="Open family" href="/app/family" />
        <PreferenceCard icon="icon_family_header" title="Pending invites" body={`${pendingInvitesQuery.data?.length ?? 0} invites waiting for this account.`} action="Open invites" href="/app/invites" />
      </section>
    </>
  );
}

export function SettingsWorkspace() {
  const api = useKlarioApi();
  const readinessQuery = useQuery({
    queryKey: ["health", "ready"],
    queryFn: healthApi.ready,
    enabled: api.status === "live"
  });

  return (
    <>
      <PageTitle title="Settings" body="Account, active workspace, and session controls." />
      <ApiStatusBanner />
      <section className="grid two-column-grid">
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_signal_confidence" size={24} /></span>
          <h3>Signed-in user</h3>
          <p>{api.user?.email ?? "Not signed in"}</p>
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_header" size={24} /></span>
          <h3>Active family</h3>
          <p>{api.activeFamily?.name ?? "No family selected"}</p>
          {api.families.length ? (
            <select value={api.activeFamily?.id ?? ""} onChange={(event) => void api.setActiveFamilyId(event.target.value)}>
              {api.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
            </select>
          ) : null}
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
          <h3>Active member</h3>
          <p>{api.activeMember?.display_name ?? "No member selected"}</p>
          {api.members.length ? (
            <select value={api.activeMember?.id ?? ""} onChange={(event) => api.setActiveMemberId(event.target.value)}>
              {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
            </select>
          ) : null}
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_sync_local" size={24} /></span>
          <h3>Environment</h3>
          <p>{prettyStatus(api.environment)} workspace. {api.currentRole ? `${prettyStatus(api.currentRole)} role.` : ""}</p>
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_signal_confidence" size={24} /></span>
          <h3>Backend readiness</h3>
          <p>{readinessQuery.isLoading ? "Checking dependencies." : readinessQuery.data ? "Backend dependencies are reachable." : "Readiness details are unavailable."}</p>
          {readinessQuery.data ? (
            <div className="tag-row">
              {Object.entries(readinessQuery.data).slice(0, 4).map(([key, value]) => (
                <span className="tag" key={key}>{prettyStatus(key)}: {String(value)}</span>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section className="workspace-bar">
        <Link className="button button-secondary" href="/app/invites">Manage invites</Link>
        <div className="button-row compact">
          <button className="button button-secondary" type="button" onClick={() => void api.refresh()}>Refresh data</button>
          <button className="button button-ghost" type="button" onClick={api.logout}>Log out</button>
        </div>
      </section>
      <p className="note app-disclaimer">Klario helps organize health reports. It is not medical advice.</p>
    </>
  );
}

export function ReportDetailWorkspace({ documentId }: { documentId: string }) {
  const api = useKlarioApi();
  const [message, setMessage] = useState("");
  const deleteDocumentMutation = useMutation({
    mutationFn: () => documentsApi.delete(documentId),
    onSuccess: async () => {
      setMessage("Report deleted. Return to reports to continue.");
      await api.invalidateWorkspaceData();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Report could not be deleted.")
  });
  const documentQuery = useQuery({
    queryKey: ["documents", "detail", documentId],
    queryFn: () => documentsApi.get(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const parsedResultsQuery = useQuery({
    queryKey: ["documents", "parsed-results", documentId],
    queryFn: () => parseApi.listParsedResults(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const attentionQuery = useQuery({
    queryKey: ["documents", "attention-items", documentId],
    queryFn: () => parseApi.listDocumentAttentionItems(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const parserRunsQuery = useQuery({
    queryKey: ["documents", "parser-runs", documentId],
    queryFn: () => parseApi.listParserRuns(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const ocrRunsQuery = useQuery({
    queryKey: ["documents", "ocr-runs", documentId],
    queryFn: () => parseApi.listOcrRuns(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const ocrPagesQuery = useQuery({
    queryKey: ["documents", "ocr-pages", documentId],
    queryFn: () => parseApi.listOcrPages(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const ocrBlocksQuery = useQuery({
    queryKey: ["documents", "ocr-blocks", documentId],
    queryFn: () => parseApi.listOcrBlocks(documentId, 1, 12),
    enabled: api.status === "live" && Boolean(documentId)
  });
  const parserDebugQuery = useQuery({
    queryKey: ["documents", "parser-debug", documentId],
    queryFn: () => parseApi.parserDebugDump(documentId),
    enabled: api.status === "live" && Boolean(documentId)
  });

  const openDownload = async () => {
    setMessage("");
    try {
      const download = await documentsApi.downloadUrl(documentId);
      window.open(download.download_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Report download is not available.");
    }
  };

  return (
    <>
      <PageTitle title={documentQuery.data?.title ?? "Report detail"} body="Parse status, extracted results, and attention items for one report." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <div>
          <span className="control-label">Document status</span>
          <strong>{documentQuery.data ? prettyStatus(documentQuery.data.status) : "Waiting for backend"}</strong>
          <p>{documentQuery.data ? `${prettyStatus(documentQuery.data.document_type)}. Uploaded ${formatDate(documentQuery.data.created_at)}.` : "Sign in to load report detail."}</p>
        </div>
        <div className="button-row compact">
          <button className="button button-secondary" type="button" disabled={!documentQuery.data} onClick={() => void openDownload()}>View report</button>
          <Link className="button button-ghost" href="/app/documents">All reports</Link>
          <button
            className="button button-ghost danger-action"
            type="button"
            disabled={!documentQuery.data || deleteDocumentMutation.isPending}
            onClick={() => {
              if (window.confirm("Delete this report? This cannot be undone.")) {
                deleteDocumentMutation.mutate();
              }
            }}
          >
            {deleteDocumentMutation.isPending ? "Deleting" : "Delete"}
          </button>
        </div>
      </div>

      <section className="section">
        <SectionHeader title="Parsed results" intro="Structured values returned by the backend medical parser." />
        <div className="record-list">
          {parsedResultsQuery.data?.length ? (
            parsedResultsQuery.data.map((result) => <ParsedResultRecord key={result.id} result={result} />)
          ) : (
            <EmptyState title="No parsed results" body="Results appear after OCR and medical parsing complete." />
          )}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Attention items" intro="No raw OCR text is shown here; only review-safe normalized fields and reasons." />
        <div className="record-list">
          {attentionQuery.data?.length ? (
            attentionQuery.data.map((item) => (
              <article className="record" key={item.id}>
                <div className="record-meta">
                  <span className={statusClass(item.status)}>{prettyStatus(item.status)}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
                <h3>{item.suggested_display_name ?? prettyStatus(item.reason_code)}</h3>
                <p>{item.reason_message}</p>
                <div className="tag-row">
                  {item.suggested_value ? <span className="tag">{item.suggested_value}{item.suggested_unit ? ` ${item.suggested_unit}` : ""}</span> : null}
                  {item.parser_confidence !== null ? <span className="tag">{Math.round(item.parser_confidence * 100)}% confidence</span> : null}
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No attention items" body="Parser questions for this report will appear here." />
          )}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Parser runs" intro="Worker status metadata for OCR and medical parsing." />
        <div className="record-list">
          {parserRunsQuery.data?.length ? (
            parserRunsQuery.data.map((run) => (
              <article className="record" key={run.id}>
                <div className="record-meta">
                  <span className={statusClass(run.status)}>{prettyStatus(run.status)}</span>
                  <span>{run.parser_version}</span>
                </div>
                <p>{run.parsed_count} parsed, {run.attention_count} attention, {run.ignored_count} ignored.</p>
              </article>
            ))
          ) : (
            <EmptyState title="No parser runs" body="Parser run metadata appears after processing starts." />
          )}
        </div>
      </section>
      <section className="section">
        <SectionHeader title="OCR diagnostics" intro="OCR run, page, and block details returned by the backend." />
        <div className="diagnostic-grid">
          <article className="flat-panel">
            <h3>OCR runs</h3>
            <p>{ocrRunsQuery.data?.length ?? 0} runs. {ocrRunsQuery.data?.[0]?.average_confidence != null ? `${Math.round(ocrRunsQuery.data[0].average_confidence * 100)}% average confidence.` : "Confidence appears after OCR completes."}</p>
            <div className="tag-row">
              {ocrRunsQuery.data?.slice(0, 3).map((run) => (
                <span className={statusClass(run.status)} key={run.id}>{prettyStatus(run.status)}</span>
              ))}
            </div>
          </article>
          <article className="flat-panel">
            <h3>Pages</h3>
            <p>{ocrPagesQuery.data?.length ?? 0} OCR pages returned.</p>
            {ocrPagesQuery.data?.[0]?.raw_text ? <p className="diagnostic-snippet">{ocrPagesQuery.data[0].raw_text.slice(0, 180)}</p> : null}
          </article>
          <article className="flat-panel">
            <h3>Blocks</h3>
            <p>{ocrBlocksQuery.data?.total ?? 0} OCR blocks indexed.</p>
            <div className="tag-row">
              {ocrBlocksQuery.data?.items.slice(0, 4).map((block) => (
                <span className="tag" key={block.id}>{prettyStatus(block.block_type)}</span>
              ))}
            </div>
          </article>
        </div>
      </section>
      <section className="section">
        <SectionHeader title="Parser debug" intro="Parser row decisions and document-level classification metadata." />
        {parserDebugQuery.data ? (
          <div className="diagnostic-grid">
            <article className="flat-panel">
              <h3>Summary</h3>
              <p>{parserDebugQuery.data.summary.parsed_count} parsed, {parserDebugQuery.data.summary.attention_count} attention, {parserDebugQuery.data.summary.ignored_count} ignored.</p>
              {parserDebugQuery.data.summary.document_classification ? <span className="status-chip is-info">{prettyStatus(parserDebugQuery.data.summary.document_classification)}</span> : null}
            </article>
            <article className="flat-panel diagnostic-wide">
              <h3>Recent decisions</h3>
              <div className="record-list compact">
                {parserDebugQuery.data.rows.slice(0, 5).map((row, index) => (
                  <article className="record" key={`${row.page_number}-${index}`}>
                    <div className="record-meta">
                      <span>Page {row.page_number}</span>
                      <span className="status-chip is-info">{prettyStatus(row.decision)}</span>
                      <span>{Math.round(row.confidence * 100)}% confidence</span>
                    </div>
                    <p>{row.suggested_display_name ?? row.matched_metric ?? row.row_text.slice(0, 90)}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <EmptyState title="No parser debug data" body="Debug rows appear after medical parsing completes." />
        )}
      </section>
      {message ? <p className="note">{message}</p> : null}
    </>
  );
}

const documentTypes: DocumentType[] = ["lab_report", "prescription", "imaging", "discharge", "vaccination", "invoice", "general"];

function ApiStatusBanner() {
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

function DocumentRecord({
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

function TrendMetricCard({ metric, active, onSelect }: { metric: TrendMetricPreview & { category?: string }; active: boolean; onSelect: () => void }) {
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

function AttentionRecord({
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

function ParsedResultRecord({ result }: { result: ParsedResult }) {
  return (
    <article className="record">
      <div className="record-meta">
        <span>{result.category}</span>
        {result.result_flag ? <span className={statusClass(result.result_flag)}>{prettyStatus(result.result_flag)}</span> : null}
        <span>{result.measured_at ? formatDate(result.measured_at) : formatDate(result.created_at)}</span>
      </div>
      <h3>{result.display_name}</h3>
      <p>{result.numeric_value !== null ? valueWithUnit(result.numeric_value, result.unit) : result.text_value ?? "No value"}</p>
      <div className="tag-row">
        {result.reference_text ? <span className="tag">{result.reference_text}</span> : null}
        <span className="tag">{Math.round(result.parser_confidence * 100)}% parser confidence</span>
      </div>
    </article>
  );
}

function EmptyState({
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
  return (
    <article className="record empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && actionHref ? (
        <div className="button-row compact">
          <Link className="button button-primary" href={actionHref}>{actionLabel}</Link>
        </div>
      ) : null}
    </article>
  );
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("need") || normalized.includes("low") || normalized.includes("fail") || normalized.includes("rejected") || normalized.includes("expired")) {
    return "status-chip is-warning";
  }
  if (normalized.includes("watch") || normalized.includes("processing") || normalized.includes("queued") || normalized.includes("pending") || normalized.includes("uploaded")) {
    return "status-chip is-info";
  }
  return "status-chip is-success";
}

function Sparkline({ points }: { points: number[] }) {
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

function PreferenceCard({ icon, title, body, action, href }: {
  icon: string;
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

function prettyStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function valueWithUnit(value: number | null, unit: string | null) {
  if (value === null) return "No value";
  return `${value}${unit ? ` ${unit}` : ""}`;
}
