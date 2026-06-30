"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PageTitle, SectionHeader } from "@/components/section";
import {
  appMetrics,
  biomarkerTrends,
  documents,
  familyProfiles,
  timelineEvents,
  uploadMethods
} from "@/lib/klario-data";
import {
  attentionApi,
  canManageInvites,
  canManageMembers,
  canResolveAttention,
  canUpload,
  dashboardApi,
  documentsApi,
  invitesApi,
  inviteRoleOptions,
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
  LatestReport,
  MemberAttentionItem,
  ParsedResult,
  TrendMetricPreview
} from "@/lib/api/types";

export function DashboardWorkspace() {
  const api = useKlarioApi();
  const [demoProfile, setDemoProfile] = useState("Joel");
  const familyId = api.activeFamily?.id;
  const memberId = api.activeMember?.id;
  const hasLiveContext = api.status === "live" && Boolean(familyId && memberId);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", familyId, memberId],
    queryFn: () => dashboardApi.get(familyId!, memberId!),
    enabled: hasLiveContext
  });

  const activeLabel = api.activeMember?.display_name ?? (demoProfile === "All" ? "everyone" : demoProfile);
  const profileDocuments = documents.filter((document) => document.owner === demoProfile || demoProfile === "All");
  const needsReview = documents.filter((document) => document.status === "Needs review");

  const metrics = dashboardQuery.data
    ? [
        { value: String(dashboardQuery.data.health_summary.score), label: "Health score", body: dashboardQuery.data.health_summary.score_note },
        { value: String(dashboardQuery.data.health_summary.normal_count), label: "In range", body: "Results inside available reference ranges." },
        { value: String(dashboardQuery.data.health_summary.attention_count), label: "Needs attention", body: "Items waiting for review or confirmation." },
        { value: String(dashboardQuery.data.latest_reports.length), label: "Latest reports", body: "Recently imported reports for this member." }
      ]
    : appMetrics;

  return (
    <>
      <PageTitle title="Dashboard" body={`Health summary for ${activeLabel}.`} />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <div>
          <span className="control-label">Active profile</span>
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
            <div className="profile-pills" role="list" aria-label="Demo family profiles">
              {["All", ...familyProfiles.slice(0, 4).map((profile) => profile.name)].map((profile) => (
                <button key={profile} className={`pill-button${demoProfile === profile ? " is-active" : ""}`} type="button" onClick={() => setDemoProfile(profile)}>
                  {profile}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link className="button button-primary" href="/app/upload">
          <BioIcon name="icon_doc_add_empty" size={17} />
          Add report
        </Link>
      </div>

      <section className="metric-grid" aria-label="Workspace summary">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-number">{metric.value}</span>
            <h3>{metric.label}</h3>
            <p>{metric.body}</p>
          </article>
        ))}
      </section>

      {dashboardQuery.data ? (
        <>
          <section className="section">
            <SectionHeader title="Needs attention" intro="Items from the backend attention list that may need confirmation." />
            <div className="record-list">
              {dashboardQuery.data.needs_attention.length ? (
                dashboardQuery.data.needs_attention.slice(0, 4).map((item) => (
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
          </section>

          <section className="section">
            <SectionHeader title="Recent reports" intro="Latest imported documents for the selected family member." />
            <div className="record-list">
              {dashboardQuery.data.latest_reports.length ? (
                dashboardQuery.data.latest_reports.slice(0, 4).map((report) => <LatestReportRecord key={report.document_id} report={report} />)
              ) : (
                <EmptyState title="No reports yet" body="Upload a report to begin building the member record." />
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="section">
            <SectionHeader title="Needs review" intro="Values that should be confirmed before they become part of the longitudinal record." />
            <div className="record-list">
              {needsReview.map((document) => (
                <article className="record record-with-action" key={document.title}>
                  <div>
                    <h3>{document.title}</h3>
                    <p>{document.source}. {document.summary}</p>
                  </div>
                  <Link className="button button-secondary" href="/app/documents">Review report</Link>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <SectionHeader title="Recent documents" intro="Demo data is shown until a live family/member is selected." />
            <div className="record-list">
              {profileDocuments.slice(0, 3).map((document) => (
                <article className="record" key={`${document.owner}-${document.title}`}>
                  <div className="record-meta">
                    <span>{document.owner}</span>
                    <span>{document.date}</span>
                    <span className={statusClass(document.status)}>{document.status}</span>
                  </div>
                  <h3>{document.title}</h3>
                  <p>{document.source}. {document.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <p className="note app-disclaimer">Based on imported reports and available reference ranges. Not a diagnosis.</p>
    </>
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
  const statusOptions = liveDocuments
    ? ["All", ...Array.from(new Set(liveDocuments.map((document) => document.status)))]
    : ["All", "Needs review", "Watch", "Saved"];

  const filteredLiveDocuments = useMemo(() => {
    if (!liveDocuments) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return liveDocuments.filter((document) => {
      const matchesStatus = status === "All" || document.status === status;
      const haystack = `${document.title} ${document.original_filename} ${document.document_type} ${document.status}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [liveDocuments, query, status]);

  const filteredDemoDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesStatus = status === "All" || document.status === status;
      const haystack = `${document.title} ${document.source} ${document.owner} ${document.summary} ${document.tags.join(" ")}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, status]);

  return (
    <>
      <PageTitle title="Reports" body="Uploaded medical reports and parse status for the current family workspace." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <label className="search-field">
          <span className="sr-only">Search reports</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports, labs, people" />
        </label>
        <div className="filter-group" aria-label="Filter reports">
          <BioIcon name="icon_filter_status" size={18} />
          {statusOptions.map((option) => (
            <button key={option} className={`pill-button${status === option ? " is-active" : ""}`} type="button" onClick={() => setStatus(option)}>
              {prettyStatus(option)}
            </button>
          ))}
        </div>
      </div>

      <section className="record-list">
        {liveDocuments ? (
          filteredLiveDocuments.length ? (
            filteredLiveDocuments.map((document) => <DocumentRecord key={document.id} document={document} />)
          ) : (
            <EmptyState title="No reports found" body="Try a different search or upload a report." />
          )
        ) : (
          filteredDemoDocuments.map((document) => (
            <article className="record document-record" key={`${document.owner}-${document.title}`}>
              <div className="record-meta">
                <span>{document.owner}</span>
                <span>{document.date}</span>
                <span className={statusClass(document.status)}>{document.status}</span>
              </div>
              <h3>{document.title}</h3>
              <p>{document.source}. {document.summary}</p>
              <div className="tag-row">
                {document.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
              <div className="button-row compact">
                <Link className="button button-secondary" href="/app/trends">View trend</Link>
                <Link className="button button-ghost" href="/app/timeline">Open timeline</Link>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}

export function UploadWorkspace() {
  const api = useKlarioApi();
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("lab_report");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const selectedIcon = uploadIcons[selectedIndex] ?? "icon_doc_generic";
  const selected = uploadMethods[selectedIndex];
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
    <>
      <PageTitle title="Add report" body="Upload a report, verify storage, start OCR, and start medical parsing." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <label className="select-field">
          <span className="control-label">Assign to</span>
          {api.members.length ? (
            <select value={selectedMemberId} onChange={(event) => onMemberChange(event.target.value)}>
              {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
            </select>
          ) : (
            <select value={selectedMemberId || "Joel"} onChange={(event) => setSelectedMemberId(event.target.value)}>
              {familyProfiles.map((profile) => <option key={profile.name} value={profile.name}>{profile.name}</option>)}
            </select>
          )}
        </label>
        <span className={uploadAllowed || !api.isSignedIn ? "status-chip is-info" : "status-chip is-warning"}>
          {api.isSignedIn ? (uploadAllowed ? "Upload enabled" : "Viewer access") : "Demo mode"}
        </span>
      </div>

      <section className="upload-layout">
        <div className="grid two-column-grid">
          {uploadMethods.map((method, index) => {
            const iconName = uploadIcons[index] ?? "icon_doc_generic";
            return (
              <button key={method.title} className={`upload-method card${index === selectedIndex ? " is-active" : ""}`} type="button" onClick={() => setSelectedIndex(index)}>
                <span className="feature-icon" aria-hidden="true"><BioIcon name={iconName} size={24} /></span>
                <span>
                  <strong>{method.title}</strong>
                  <small>{method.body}</small>
                </span>
              </button>
            );
          })}
        </div>

        <aside className="interactive-panel upload-panel">
          <span className="feature-icon" aria-hidden="true"><BioIcon name={selectedIcon} size={26} /></span>
          <h2>{selected.title}</h2>
          <p>{selected.body}</p>
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
          <label className="drop-zone">
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif" onChange={onFileChange} />
            <span>{fileName || "Choose PDF, JPEG, PNG, HEIC, or HEIF"}</span>
          </label>
          <button className="button button-primary" type="button" disabled={isUploading || !selectedFile || !api.isSignedIn || !uploadAllowed} onClick={startParsing}>
            <BioIcon name={isUploading ? "icon_action_loading" : "icon_action_confirm_safe"} size={17} />
            {isUploading ? "Processing" : "Start parsing"}
          </button>
          {statusMessage ? <p className={statusMessage.includes("permission") || statusMessage.includes("supported") ? "form-alert" : "note"}>{statusMessage}</p> : null}
          <p className="note">Klario validates files up to 25 MB, completes the presigned upload, then creates OCR and medical parse jobs.</p>
        </aside>
      </section>
    </>
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
      <PageTitle title="Timeline" body={`Longitudinal health history for ${api.activeMember?.display_name ?? "Joel"}.`} />
      <ApiStatusBanner />
      <section className="timeline-list">
        {(liveEvents.length ? liveEvents : timelineEvents).map((event) => (
          <article className="timeline-item" key={`${event.date}-${event.title}`}>
            <span>{event.date}</span>
            <h3>{event.title}</h3>
            <p>{event.body}</p>
          </article>
        ))}
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
  const [demoActiveName, setDemoActiveName] = useState(biomarkerTrends[0].name);

  useEffect(() => {
    if (apiMetrics.length && !apiMetrics.some((metric) => metric.canonical_metric_id === activeMetricId)) {
      setActiveMetricId(apiMetrics[0].canonical_metric_id);
    }
  }, [activeMetricId, apiMetrics]);

  const activeMetric = apiMetrics.find((metric) => metric.canonical_metric_id === activeMetricId) ?? apiMetrics[0];
  const demoActive = biomarkerTrends.find((trend) => trend.name === demoActiveName) ?? biomarkerTrends[0];

  return (
    <>
      <PageTitle title="Trends" body={`Longitudinal biomarkers for ${api.activeMember?.display_name ?? "Joel"}.`} />
      <ApiStatusBanner />
      <section className="trends-layout">
        {activeMetric ? (
          <>
            <div className="interactive-panel trend-detail">
              <div className="record-meta">
                {activeMetric.latest_flag ? <span className={statusClass(activeMetric.latest_flag)}>{prettyStatus(activeMetric.latest_flag)}</span> : null}
                <span>{activeMetric.reading_count} readings</span>
              </div>
              <h2>{activeMetric.display_name}</h2>
              <p className="trend-value">{valueWithUnit(activeMetric.latest_value, activeMetric.unit)}</p>
              <Sparkline points={activeMetric.sparkline.map((point) => point.value)} />
              <p>{activeMetric.category}. Latest reading {activeMetric.latest_date ? formatDate(activeMetric.latest_date) : "not dated"}.</p>
              <Link className="button button-secondary" href={`/app/trends/${activeMetric.canonical_metric_id}`}>Open metric</Link>
            </div>
            <div className="grid trend-card-grid">
              {apiMetrics.map((metric) => <TrendMetricCard key={metric.canonical_metric_id} metric={metric} active={activeMetric.canonical_metric_id === metric.canonical_metric_id} onSelect={() => setActiveMetricId(metric.canonical_metric_id)} />)}
            </div>
          </>
        ) : (
          <>
            <div className="interactive-panel trend-detail">
              <div className="record-meta">
                <span className={statusClass(demoActive.status)}>{demoActive.status}</span>
                <span>{demoActive.range}</span>
              </div>
              <h2>{demoActive.name}</h2>
              <p className="trend-value">{demoActive.value} <span>{demoActive.unit}</span></p>
              <Sparkline points={demoActive.points} />
              <p>{demoActive.description}</p>
            </div>
            <div className="grid trend-card-grid">
              {biomarkerTrends.map((trend) => (
                <button key={trend.name} className={`card trend-card${demoActive.name === trend.name ? " is-active" : ""}`} type="button" onClick={() => setDemoActiveName(trend.name)}>
                  <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_trends" size={22} /></span>
                  <h3>{trend.name}</h3>
                  <p><strong>{trend.value} {trend.unit}</strong></p>
                  <p>{trend.range}. {trend.points.length} data points.</p>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </>
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
  const [demoActiveName, setDemoActiveName] = useState(familyProfiles[0].name);
  const [familyName, setFamilyName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const activeDemo = familyProfiles.find((profile) => profile.name === demoActiveName) ?? familyProfiles[0];
  const memberCreateAllowed = canManageMembers(api.currentRole);

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
    <>
      <PageTitle title="Family" body="Manage family selection, member profiles, and roles." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <div>
          <span className="control-label">Selected workspace</span>
          <strong>{api.activeFamily?.name ?? activeDemo.name}</strong>
          <p>{api.currentRole ? `${prettyStatus(api.currentRole)} role` : `${activeDemo.role}. ${activeDemo.detail}.`}</p>
        </div>
        {api.families.length ? (
          <label className="select-field">
            <span className="control-label">Family</span>
            <select value={api.activeFamily?.id ?? ""} onChange={(event) => void api.setActiveFamilyId(event.target.value)}>
              {api.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <section className="grid two-column-grid">
        {api.members.length ? (
          api.members.map((member) => (
            <button key={member.id} className={`card profile-card${api.activeMember?.id === member.id ? " is-active" : ""}`} type="button" onClick={() => api.setActiveMemberId(member.id)}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
              <h3>{member.display_name}</h3>
              <p>{member.relationship}. {member.sex ? `${prettyStatus(member.sex)}. ` : ""}{member.date_of_birth ? `Born ${formatDate(member.date_of_birth)}.` : ""}</p>
              <span className="status-chip">{member.id}</span>
            </button>
          ))
        ) : (
          familyProfiles.map((profile) => (
            <button key={profile.name} className={`card profile-card${activeDemo.name === profile.name ? " is-active" : ""}`} type="button" onClick={() => setDemoActiveName(profile.name)}>
              <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
              <h3>{profile.name}</h3>
              <p>{profile.role}. {profile.detail}.</p>
              <span className="status-chip">{profile.documents} documents</span>
            </button>
          ))
        )}
      </section>

      <section className="grid two-column-grid">
        <form className="card preference-card" onSubmit={createFamily}>
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_add" size={24} /></span>
          <h3>Create family</h3>
          <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Family name" required />
          <button className="button button-secondary" type="submit" disabled={!api.isSignedIn}>Create</button>
        </form>
        <form className="card preference-card" onSubmit={createMember}>
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_header" size={24} /></span>
          <h3>Add member</h3>
          <input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Display name" required />
          <input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Relationship" required />
          <button className="button button-secondary" type="submit" disabled={!api.activeFamily || !memberCreateAllowed}>Add</button>
        </form>
      </section>

      <section className="section">
        <SectionHeader title="Roles" intro="Backend roles decide who can upload, manage profiles, resolve attention items, and send invites." />
        <div className="record-list">
          {api.roles.length ? (
            api.roles.map((role) => (
              <article className="record" key={role.id}>
                <div className="record-meta">
                  <span>{role.user_id}</span>
                  <span className="status-chip is-info">{prettyStatus(role.role)}</span>
                </div>
                <p>Family role created {formatDate(role.created_at)}.</p>
              </article>
            ))
          ) : (
            <EmptyState title="No roles loaded" body="Roles appear after signing in and selecting a family." />
          )}
        </div>
        {message ? <p className="note">{message}</p> : null}
      </section>
    </>
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

  return (
    <>
      <PageTitle title="Attention" body="Review extracted values and parser items that need a human decision." />
      <ApiStatusBanner />
      <div className="workspace-bar">
        <div className="filter-group" aria-label="Attention status">
          {["open", "accepted", "rejected", "resolved"].map((option) => (
            <button key={option} className={`pill-button${filter === option ? " is-active" : ""}`} type="button" onClick={() => setFilter(option)}>
              {prettyStatus(option)}
            </button>
          ))}
        </div>
        <span className={resolveAllowed ? "status-chip is-info" : "status-chip is-warning"}>
          {resolveAllowed ? "Resolve enabled" : "Read only"}
        </span>
      </div>

      <section className="record-list">
        {attentionQuery.data ? (
          attentionQuery.data.items.length ? (
            attentionQuery.data.items.map((item) => (
              <AttentionRecord key={item.id} item={item} canResolve={resolveAllowed} isWorking={updateMutation.isPending} onUpdate={(status) => updateMutation.mutate({ id: item.id, status })} />
            ))
          ) : (
            <EmptyState title="No attention items" body="Open parser questions and out-of-range extracted results will appear here." />
          )
        ) : (
          documents.filter((document) => document.status === "Needs review").map((document) => (
            <article className="record" key={document.title}>
              <div className="record-meta">
                <span>{document.owner}</span>
                <span className="status-chip is-warning">Demo</span>
              </div>
              <h3>{document.title}</h3>
              <p>{document.summary}</p>
            </article>
          ))
        )}
      </section>
      {message ? <p className="note">{message}</p> : null}
    </>
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
  const [settings, setSettings] = useState({
    notifications: true,
    smartReview: true,
    securityAlerts: true,
    educationalNotice: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <>
      <PageTitle title="Settings" body="Account, active workspace, environment, and cache controls." />
      <ApiStatusBanner />
      <section className="grid two-column-grid">
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_signal_confidence" size={24} /></span>
          <h3>Signed-in user</h3>
          <p>{api.user?.email ?? "Not signed in"}</p>
          <span className="status-chip">{api.status}</span>
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_header" size={24} /></span>
          <h3>Active family</h3>
          <p>{api.activeFamily ? `${api.activeFamily.name} - ${api.activeFamily.id}` : "No family selected"}</p>
          {api.families.length ? (
            <select value={api.activeFamily?.id ?? ""} onChange={(event) => void api.setActiveFamilyId(event.target.value)}>
              {api.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
            </select>
          ) : null}
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_family" size={24} /></span>
          <h3>Active member</h3>
          <p>{api.activeMember ? `${api.activeMember.display_name} - ${api.activeMember.id}` : "No member selected"}</p>
          {api.members.length ? (
            <select value={api.activeMember?.id ?? ""} onChange={(event) => api.setActiveMemberId(event.target.value)}>
              {api.members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
            </select>
          ) : null}
        </article>
        <article className="card preference-card">
          <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_sync_local" size={24} /></span>
          <h3>Backend</h3>
          <p>{prettyStatus(api.environment)}. Last sync {api.lastSyncAt ? formatDate(api.lastSyncAt) : "not synced"}.</p>
          <span className="status-chip is-info">{api.currentRole ? prettyStatus(api.currentRole) : "No role"}</span>
        </article>
      </section>

      <section className="grid two-column-grid">
        <ToggleCard icon="icon_signal_warning" title="Notifications" body="Reminders for reviews, repeat tests, and follow-up items." checked={settings.notifications} onToggle={() => toggle("notifications")} />
        <ToggleCard icon="icon_filter_status" title="Import preferences" body="Default family member, file source, and review behavior." checked={settings.smartReview} onToggle={() => toggle("smartReview")} />
        <ToggleCard icon="icon_action_confirm_safe" title="Security" body="Session access and account protection." checked={settings.securityAlerts} onToggle={() => toggle("securityAlerts")} />
        <ToggleCard icon="icon_signal_confidence" title="Educational notice" body="Klario helps organize and understand records. It is not medical advice." checked={settings.educationalNotice} onToggle={() => toggle("educationalNotice")} />
      </section>

      <section className="workspace-bar">
        <Link className="button button-secondary" href="/app/invites">Manage invites</Link>
        <div className="button-row compact">
          <button className="button button-secondary" type="button" onClick={() => void api.refresh()}>Refresh data</button>
          <button className="button button-ghost" type="button" onClick={api.logout}>Log out</button>
        </div>
      </section>
    </>
  );
}

export function ReportDetailWorkspace({ documentId }: { documentId: string }) {
  const api = useKlarioApi();
  const [message, setMessage] = useState("");
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
      {message ? <p className="note">{message}</p> : null}
    </>
  );
}

const uploadIcons = ["icon_doc_add_empty", "icon_doc_choose_file", "icon_doc_generic", "icon_doc_import_panel", "icon_sync_local", "icon_family_header"];
const documentTypes: DocumentType[] = ["lab_report", "prescription", "imaging", "discharge", "vaccination", "invoice", "general"];

function ApiStatusBanner() {
  const api = useKlarioApi();

  if (api.status === "live" && api.activeFamily) return null;

  return (
    <div className={`app-status-banner is-${api.status}`}>
      <div>
        <strong>{api.status === "checking" ? "Checking backend" : prettyStatus(api.status)}</strong>
        <p>{api.message ?? (api.status === "live" ? "Create or select a family to connect backend data." : "Backend data is not connected yet.")}</p>
      </div>
      {api.status === "signed-out" ? <Link className="button button-secondary" href="/login">Sign in</Link> : null}
    </div>
  );
}

function LatestReportRecord({ report }: { report: LatestReport }) {
  return (
    <article className="record document-record">
      <div className="record-meta">
        <span>{formatDate(report.created_at)}</span>
        <span className={statusClass(report.status)}>{prettyStatus(report.status)}</span>
      </div>
      <h3>{report.title}</h3>
      <p>{prettyStatus(report.document_type)}. {report.parsed_count} parsed results, {report.attention_count} attention items.</p>
      <div className="button-row compact">
        <Link className="button button-secondary" href={`/app/reports/${report.document_id}`}>Open report</Link>
      </div>
    </article>
  );
}

function DocumentRecord({ document }: { document: KlarioDocument }) {
  return (
    <article className="record document-record">
      <div className="record-meta">
        <span>{formatDate(document.created_at)}</span>
        <span className={statusClass(document.status)}>{prettyStatus(document.status)}</span>
        <span>{prettyStatus(document.document_type)}</span>
      </div>
      <h3>{document.title}</h3>
      <p>{document.original_filename}. {formatFileSize(document.file_size)}.</p>
      <div className="tag-row">
        <span className="tag">{document.content_type}</span>
        {document.checksum ? <span className="tag">Checksum verified</span> : null}
      </div>
      <div className="button-row compact">
        <Link className="button button-secondary" href={`/app/reports/${document.id}`}>Open report</Link>
        <Link className="button button-ghost" href="/app/trends">View trends</Link>
      </div>
    </article>
  );
}

function TrendMetricCard({ metric, active, onSelect }: { metric: TrendMetricPreview & { category?: string }; active: boolean; onSelect: () => void }) {
  return (
    <button className={`card trend-card${active ? " is-active" : ""}`} type="button" onClick={onSelect}>
      <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_tab_trends" size={22} /></span>
      <h3>{metric.display_name}</h3>
      <p><strong>{valueWithUnit(metric.latest_value, metric.unit)}</strong></p>
      <p>{metric.category ?? "Trend"}. {metric.reading_count} readings.</p>
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
    <article className="record document-record">
      <div className="record-meta">
        <span>{formatDate(item.created_at)}</span>
        <span className={statusClass(item.status)}>{prettyStatus(item.status)}</span>
        <span>{prettyStatus(item.source)}</span>
      </div>
      <h3>{item.display_name ?? prettyStatus(item.reason_code)}</h3>
      <p>{item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ""}. ` : ""}{prettyStatus(item.reason_code)}.</p>
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <article className="record empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
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

function ToggleCard({ icon, title, body, checked, onToggle }: {
  icon: string;
  title: string;
  body: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="card preference-card">
      <span className="feature-icon" aria-hidden="true"><BioIcon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      <button className={`toggle-control${checked ? " is-on" : ""}`} type="button" role="switch" aria-checked={checked} onClick={onToggle}>
        <span />
      </button>
    </article>
  );
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
