"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PageTitle, SectionHeader } from "@/components/section";
import {
  Card,
  IconBadge,
  RootPageHeader,
  SearchField,
  SectionHeader as KlarioSectionHeader,
  SkeletonCard,
  StatusPill
} from "@/components/klario-ui";
import { documentTypeIconMap } from "@/lib/icons";
import {
  canUpload,
  documentsApi,
  reportsApi
} from "@/lib/api/klario-api";
import { uploadAndParseReport, validateReportFile, type UploadStatusUpdate } from "@/lib/api/upload";
import { protectedQueryKey, queryFreshness } from "@/lib/query-cache";
import type {
  DocumentType,
  ReportPublicStatus,
  ReportResultDetail,
  ReportSummary
} from "@/lib/api/types";
import {
  ApiStatusBanner,
  AttentionRecord,
  EmptyState,
  documentTypes,
  formatDate,
  prettyStatus,
} from "@/components/workspaces/shared";

function getReportStatusTone(status: ReportPublicStatus) {
  if (status === "ready") return "green";
  if (status === "needs_review") return "orange";
  if (status === "failed") return "red";
  if (status === "archived") return "gray";
  return "blue";
}

function getReportStatusIcon(status: ReportPublicStatus) {
  if (status === "ready") return "icon_action_confirm_safe";
  if (status === "needs_review") return "icon_review_required";
  if (status === "failed") return "icon_action_reject";
  if (status === "archived") return "icon_doc_missing_file";
  return "icon_action_loading";
}

function asDocumentType(value: string): DocumentType {
  return documentTypes.includes(value as DocumentType) ? value as DocumentType : "general";
}
export function DocumentsWorkspace() {
  const api = useKlarioApi();
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "All">("All");
  const [isAddOptionsOpen, setIsAddOptionsOpen] = useState(false);
  const [uploadSource, setUploadSource] = useState<"files" | "photos" | null>(null);
  const [editingDocument, setEditingDocument] = useState<ReportSummary | null>(null);
  const [documentPendingDeletion, setDocumentPendingDeletion] = useState<ReportSummary | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const familyId = api.activeFamily?.id;

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  const liveReportsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "reports", "list", familyId, memberFilter, typeFilter, query),
    queryFn: () => reportsApi.list(familyId!, {
      member_id: memberFilter === "All" ? undefined : memberFilter,
      report_type: typeFilter === "All" ? undefined : typeFilter,
      status: undefined,
      search: query || undefined,
      include_archived: false,
      limit: 100
    }),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId),
    ...queryFreshness.processing
  });

  const liveReports = liveReportsQuery.data?.items ?? null;
  const archiveReportMutation = useMutation({
    mutationFn: (reportId: string) => reportsApi.archive(familyId!, reportId),
    onSuccess: () => api.invalidateWorkspaceData()
  });
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(documentId),
    onSuccess: async () => {
      setDocumentPendingDeletion(null);
      await api.invalidateWorkspaceData();
    }
  });
  const editReportMutation = useMutation({
    mutationFn: async ({ reportId, title, documentType }: { reportId: string; title: string; documentType: DocumentType }) => {
      const detail = await reportsApi.detail(familyId!, reportId);
      return reportsApi.update(familyId!, reportId, { version: detail.version, display_name: title, category: documentType });
    },
    onSuccess: async () => {
      setEditingDocument(null);
      await api.invalidateWorkspaceData();
    }
  });
  const memberOptions = api.members.length ? [{ id: "All", display_name: "All profiles" }, ...api.members] : [{ id: "All", display_name: "All profiles" }];
  const hasActiveFilters = query.trim() !== "" || memberFilter !== "All" || typeFilter !== "All";
  const clearFilters = () => {
    setQuery("");
    setMemberFilter("All");
    setTypeFilter("All");
  };
  return (
    <div className="flat-workspace reports-workspace">
      <RootPageHeader
        title="Reports"
        subtitle="Search, review, and manage your medical reports."
        action={(
          <button className="button button-primary" type="button" onClick={() => setIsAddOptionsOpen(true)}>
            <BioIcon name="icon_doc_add_empty" size={17} />
            Add report
          </button>
        )}
      />
      <ApiStatusBanner />
      <div className="workspace-bar reports-toolbar">
        <SearchField value={query} onChange={setQuery} label="Search reports" placeholder="Search reports" />
        <label className="select-field reports-select-filter">
          <span className="sr-only">Filter by profile</span>
          <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
            {memberOptions.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
          </select>
        </label>
        <label className="select-field reports-select-filter">
          <span className="sr-only">Filter by report type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as DocumentType | "All")}>
            <option value="All">All types</option>
            {documentTypes.map((type) => <option key={type} value={type}>{prettyStatus(type)}</option>)}
          </select>
        </label>
        <button className="button button-ghost reports-clear-filter" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>
          <BioIcon name="icon_filter_clear" size={16} />
          Clear
        </button>
      </div>

      <section className="record-list reports-list" id="reports-list">
        {liveReportsQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : liveReports ? (
          liveReports.length ? (
            liveReports.map((report) => (
              <ReportDocumentCard
                key={report.id}
                report={report}
                deleting={archiveReportMutation.variables === report.id && archiveReportMutation.isPending}
                onDelete={(reportId) => {
                  const confirmed = window.confirm("Klario will archive this report and remove it from active dashboard and trends views.");
                  if (confirmed) archiveReportMutation.mutate(reportId);
                }}
                permanentlyDeleting={deleteDocumentMutation.variables === report.id && deleteDocumentMutation.isPending}
                onPermanentDelete={setDocumentPendingDeletion}
                editing={editReportMutation.variables?.reportId === report.id && editReportMutation.isPending}
                onEdit={setEditingDocument}
              />
            ))
          ) : (
            <EmptyState title="No reports found" body="Try a different search or add a report." />
          )
        ) : (
          <EmptyState title="No family selected" body="Create a family and add your first report." />
        )}
      </section>

      {isAddOptionsOpen && portalHost ? createPortal(
        <ReportAddOptionsModal
          onClose={() => setIsAddOptionsOpen(false)}
          onChoose={(source) => {
            setIsAddOptionsOpen(false);
            setUploadSource(source);
          }}
        />,
        portalHost
      ) : null}
      {uploadSource && portalHost ? createPortal(
        <ReportUploadModal source={uploadSource} onClose={() => setUploadSource(null)} />,
        portalHost
      ) : null}
      {editingDocument && portalHost ? createPortal(
        <ReportEditModal
          report={editingDocument}
          isSaving={editReportMutation.isPending}
          error={editReportMutation.error}
          onClose={() => setEditingDocument(null)}
          onSave={(title, documentType) => editReportMutation.mutate({ reportId: editingDocument.id, title, documentType })}
        />,
        portalHost
      ) : null}
      {documentPendingDeletion && portalHost ? createPortal(
        <DeleteReportModal
          report={documentPendingDeletion}
          isDeleting={deleteDocumentMutation.isPending}
          error={deleteDocumentMutation.error}
          onClose={() => setDocumentPendingDeletion(null)}
          onDelete={() => deleteDocumentMutation.mutate(documentPendingDeletion.id)}
        />,
        portalHost
      ) : null}
    </div>
  );
}

function ReportAddOptionsModal({ onClose, onChoose }: { onClose: () => void; onChoose: (source: "files" | "photos") => void }) {
  return (
    <div className="klario-modal-overlay" role="presentation">
      <div className="klario-modal report-add-options-modal" role="dialog" aria-modal="true" aria-labelledby="report-add-options-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="report-add-options-title">Add Report</h2>
            <p>Choose how you want to add one or more report pages.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" aria-label="Close add report" onClick={onClose}>
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        <div className="report-add-options-list">
          <button className="report-add-option" type="button" onClick={() => onChoose("photos")}>
            <IconBadge icon="icon_doc_scan_import" tone="blue" />
            <span><strong>Choose from Photos</strong><small>Pick report images from this device.</small></span>
            <BioIcon name="icon_action_continue" size={16} />
          </button>
          <button className="report-add-option" type="button" onClick={() => onChoose("files")}>
            <IconBadge icon="icon_doc_choose_file" tone="gray" />
            <span><strong>Import PDF or File</strong><small>Choose a PDF or report image from your files.</small></span>
            <BioIcon name="icon_action_continue" size={16} />
          </button>
          <p className="report-add-platform-note"><BioIcon name="icon_doc_scan_import" size={15} /> Scan Document is managed from the Klario iOS app.</p>
        </div>
      </div>
    </div>
  );
}

export function ReportUploadModal({ source = "files", onClose }: { source?: "files" | "photos"; onClose: () => void }) {
  return (
    <div className="klario-modal-overlay" role="presentation">
      <div className="klario-modal report-upload-modal" role="dialog" aria-modal="true" aria-labelledby="report-upload-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="report-upload-title">Add Report</h2>
            <p>Assign a report to a Klario profile before analysis.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" aria-label="Close upload" onClick={onClose}>
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        <UploadWorkspace source={source} />
      </div>
    </div>
  );
}

function ReportDocumentCard({
  report,
  deleting,
  onDelete,
  permanentlyDeleting,
  onPermanentDelete,
  editing,
  onEdit
}: {
  report: ReportSummary;
  deleting: boolean;
  onDelete: (reportId: string) => void;
  permanentlyDeleting: boolean;
  onPermanentDelete: (report: ReportSummary) => void;
  editing: boolean;
  onEdit: (report: ReportSummary) => void;
}) {
  const statusTone = getReportStatusTone(report.status);
  const typeIcon = documentTypeIconMap[asDocumentType(report.report_type.id)];

  return (
    <Card className="report-document-card">
      <IconBadge icon={typeIcon} tone={statusTone} />
      <div className="report-document-card-main">
        <div className="record-meta">
          <span>{formatDate(report.display_date ?? report.uploaded_at ?? report.updated_at)}</span>
          <span>{report.report_type.display_name}</span>
          <StatusPill tone={statusTone}>{report.status_label}</StatusPill>
        </div>
        <h3>{report.display_name}</h3>
        <p>{report.original_filename}. {report.status_message}</p>
      </div>
      <div className="report-document-card-actions">
        <Link className="button button-secondary" href={`/app/reports/${report.id}`}>Open</Link>
        <button className="button button-ghost" type="button" disabled={!report.can_rename || editing} onClick={() => onEdit(report)}>
          {editing ? "Saving" : "Edit"}
        </button>
        <button className="button button-ghost danger-action" type="button" disabled={!report.can_archive || deleting} onClick={() => onDelete(report.id)}>
          {deleting ? "Archiving" : "Archive"}
        </button>
        <button className="button button-ghost danger-action" type="button" disabled={!report.can_archive || permanentlyDeleting} onClick={() => onPermanentDelete(report)}>
          {permanentlyDeleting ? "Deleting" : "Delete"}
        </button>
      </div>
    </Card>
  );
}

function DeleteReportModal({
  report,
  isDeleting,
  error,
  onClose,
  onDelete
}: {
  report: ReportSummary;
  isDeleting: boolean;
  error: Error | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="klario-modal-overlay" role="presentation">
      <div className="klario-modal report-delete-modal" role="dialog" aria-modal="true" aria-labelledby="report-delete-title">
        <div className="klario-modal-head">
          <div>
            <h2 id="report-delete-title">Delete report?</h2>
            <p><strong>{report.display_name}</strong> will be removed from your active records and placed in Recently Deleted. It can be restored during the retention period.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" aria-label="Close delete report" disabled={isDeleting} onClick={onClose}>
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        {error ? <p className="form-error report-delete-error">{error.message}</p> : null}
        <div className="modal-actions">
          <button className="button button-ghost" type="button" disabled={isDeleting} onClick={onClose}>Cancel</button>
          <button className="button button-danger" type="button" disabled={isDeleting} onClick={onDelete}>{isDeleting ? "Deleting" : "Delete report"}</button>
        </div>
      </div>
    </div>
  );
}

function ReportEditModal({
  report,
  isSaving,
  error,
  onClose,
  onSave
}: {
  report: ReportSummary;
  isSaving: boolean;
  error: Error | null;
  onClose: () => void;
  onSave: (title: string, documentType: DocumentType) => void;
}) {
  const [title, setTitle] = useState(report.display_name);
  const [documentType, setDocumentType] = useState<DocumentType>(asDocumentType(report.report_type.id));
  const trimmedTitle = title.trim();
  const hasChanges = trimmedTitle !== report.display_name || documentType !== asDocumentType(report.report_type.id);

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle || !hasChanges || isSaving) return;
    onSave(trimmedTitle, documentType);
  };

  return (
    <div className="klario-modal-overlay" role="presentation">
      <form className="klario-modal report-edit-modal" role="dialog" aria-modal="true" aria-labelledby="report-edit-title" onSubmit={submitEdit}>
        <div className="klario-modal-head">
          <div>
            <h2 id="report-edit-title">Edit report</h2>
            <p>Update the report name and document type.</p>
          </div>
          <button className="button button-ghost icon-button" type="button" aria-label="Close edit report" onClick={onClose}>
            <BioIcon name="icon_action_reject" size={18} />
          </button>
        </div>
        <div className="report-edit-form">
          <label>
            <span className="control-label">Report title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Report title" />
          </label>
          <label className="select-field">
            <span className="control-label">Document type</span>
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)}>
              {documentTypes.map((type) => <option key={type} value={type}>{prettyStatus(type)}</option>)}
            </select>
          </label>
          {error ? <p className="form-alert">{error.message}</p> : null}
        </div>
        <div className="report-edit-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={!trimmedTitle || !hasChanges || isSaving}>
            {isSaving ? "Saving" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function UploadWorkspace({ source = "files" }: { source?: "files" | "photos" }) {
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
          <h1>{source === "photos" ? "Choose report images" : "Import report"}</h1>
          <p>Assign your report to a profile, then let Klario analyze it.</p>
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
                <p>{source === "photos" ? "Choose an image up to 25 MB." : "PDF or image up to 25 MB."}</p>
              </div>
              <label className="drop-zone">
                <input
                  type="file"
                  accept={source === "photos" ? "image/jpeg,image/png,image/heic,image/heif" : "application/pdf,image/jpeg,image/png,image/heic,image/heif"}
                  onChange={onFileChange}
                />
                <span>{fileName || (source === "photos" ? "Choose JPEG, PNG, HEIC, or HEIF" : "Choose PDF, JPEG, PNG, HEIC, or HEIF")}</span>
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
    queryKey: protectedQueryKey(api.user?.id, "reports", "timeline", familyId),
    queryFn: () => reportsApi.list(familyId!, { limit: 100 }),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId),
    ...queryFreshness.workspace
  });

  const liveEvents = (documentsQuery.data?.items ?? [])
    .map((report) => ({
      date: formatDate(report.display_date ?? report.uploaded_at ?? report.updated_at),
      title: report.display_name,
      body: `${report.report_type.display_name}. ${report.status_label}.`
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

export function ReportDetailWorkspace({ documentId }: { documentId: string }) {
  const api = useKlarioApi();
  const [message, setMessage] = useState("");
  const familyId = api.activeFamily?.id;
  const archiveReportMutation = useMutation({
    mutationFn: () => reportsApi.archive(familyId!, documentId),
    onSuccess: async () => {
      setMessage("Report archived. Return to reports to continue.");
      await api.invalidateWorkspaceData();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Report could not be archived.")
  });
  const restoreReportMutation = useMutation({
    mutationFn: () => reportsApi.restore(familyId!, documentId),
    onSuccess: async () => {
      setMessage("Report restored.");
      await api.invalidateWorkspaceData();
      await reportQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Report could not be restored.")
  });
  const reportQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "reports", "detail", familyId, documentId),
    queryFn: () => reportsApi.detail(familyId!, documentId),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && documentId),
    ...queryFreshness.processing
  });
  const report = reportQuery.data;
  const statusTone = report ? getReportStatusTone(report.status) : "gray";
  const statusIcon = report ? getReportStatusIcon(report.status) : "icon_doc_generic";
  const reportTypeIcon = report ? documentTypeIconMap[asDocumentType(report.report_type.id)] : "icon_doc_generic";

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
      <RootPageHeader
        title={report?.display_name ?? "Report detail"}
        subtitle="Editable report detail from the backend reports API."
        action={
          <div className="button-row compact">
            <button className="button button-secondary" type="button" disabled={!report} onClick={() => void openDownload()}>View report</button>
            <Link className="button button-ghost" href="/app/reports">All reports</Link>
            {report?.status === "archived" ? (
              <button className="button button-secondary" type="button" disabled={restoreReportMutation.isPending} onClick={() => restoreReportMutation.mutate()}>
                {restoreReportMutation.isPending ? "Restoring" : "Restore"}
              </button>
            ) : null}
            <button
              className="button button-ghost danger-action"
              type="button"
              disabled={!report?.can_archive || archiveReportMutation.isPending}
              onClick={() => {
                if (window.confirm("Klario will archive this report and remove it from active dashboard and trends views.")) {
                  archiveReportMutation.mutate();
                }
              }}
            >
              {archiveReportMutation.isPending ? "Archiving" : "Archive"}
            </button>
          </div>
        }
      />
      <ApiStatusBanner />

      {reportQuery.isLoading ? (
        <SkeletonCard />
      ) : (
        <Card className="report-detail-summary">
          <IconBadge icon={statusIcon} tone={statusTone} size={48} />
          <div>
            <div className="report-detail-summary-head">
              <h2>{report ? report.report_type.display_name : "Waiting for backend"}</h2>
              <StatusPill tone={statusTone}>{report ? report.status_label : "Not loaded"}</StatusPill>
            </div>
            <p>
              {report
                ? `Uploaded ${formatDate(report.uploaded_at ?? report.updated_at)}. ${report.status_message}`
                : "Sign in to load report detail."}
            </p>
            {report ? (
              <div className="tag-row">
                <span className="tag">
                  <BioIcon name={reportTypeIcon} size={14} />
                  {report.report_type.display_name}
                </span>
                {report.provider_name ? <span className="tag">{report.provider_name}</span> : null}
                {report.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            ) : null}
          </div>
        </Card>
      )}

      <Card className="report-detail-section">
        <KlarioSectionHeader title="Parsed results" subtitle="Structured values returned by the backend medical parser." />
        <div className="record-list">
          {report?.results.length ? (
            report.results.map((result) => <ReportResultDetailRecord key={result.id} result={result} />)
          ) : (
            <EmptyState title="No parsed results" body="Results appear after OCR and medical parsing complete." />
          )}
        </div>
      </Card>

      {message ? <p className="note">{message}</p> : null}
    </>
  );
}

function ReportResultDetailRecord({ result }: { result: ReportResultDetail }) {
  const value = result.effective_value ?? result.parsed_value ?? "No value";
  const flagTone = result.result_flag === "critical" || result.result_flag === "high" ? "red" : result.result_flag ? "orange" : "gray";

  return (
    <article className="record">
      <div className="record-meta">
        <span>{result.name}</span>
        <span>{result.value_source === "user_corrected" ? "Corrected" : "Parser"}</span>
      </div>
      <p>{value}{result.unit ? ` ${result.unit}` : ""}</p>
      <div className="tag-row">
        {result.reference_range ? <span className="tag">Range {result.reference_range}</span> : null}
        {result.result_flag ? <StatusPill tone={flagTone}>{prettyStatus(result.result_flag)}</StatusPill> : null}
        <span className="tag">{Math.round(result.parser_confidence * 100)}% parser confidence</span>
      </div>
    </article>
  );
}
