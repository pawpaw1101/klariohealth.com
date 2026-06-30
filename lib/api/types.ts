export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyCreateRequest {
  name: string;
}

export interface FamilyUpdateRequest {
  name?: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  display_name: string;
  relationship: string;
  date_of_birth: string | null;
  sex: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberCreateRequest {
  display_name: string;
  relationship: string;
  date_of_birth?: string | null;
  sex?: string | null;
}

export interface MemberUpdateRequest {
  display_name?: string;
  relationship?: string;
  date_of_birth?: string | null;
  sex?: string | null;
}

export type FamilyRoleType = "owner" | "admin" | "contributor" | "viewer";

export interface FamilyRole {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRoleType;
  created_at: string;
}

export interface RoleCreateRequest {
  user_email: string;
  role: Exclude<FamilyRoleType, "owner">;
}

export interface RoleUpdateRequest {
  role: Exclude<FamilyRoleType, "owner">;
}

export type DocumentType =
  | "lab_report"
  | "prescription"
  | "imaging"
  | "discharge"
  | "vaccination"
  | "invoice"
  | "general";

export type DocumentStatus =
  | "upload_pending"
  | "uploaded"
  | "upload_failed"
  | "queued"
  | "processing"
  | "ocr_processing"
  | "ocr_completed"
  | "ready_for_medical_parse"
  | "ocr_failed"
  | "medical_parsing"
  | "medical_parse_failed"
  | "parsed"
  | "parsed_empty"
  | "needs_attention"
  | "failed";

export interface Document {
  id: string;
  family_id: string;
  family_member_id: string;
  uploaded_by_user_id: string;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  original_filename: string;
  content_type: string;
  file_size: number;
  storage_key: string | null;
  checksum: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreateRequest {
  family_member_id: string;
  title: string;
  document_type: DocumentType;
  original_filename: string;
  content_type: string;
  file_size: number;
}

export interface DocumentUpdateRequest {
  title?: string;
  document_type?: DocumentType;
}

export interface UploadIntentRequest {
  family_member_id: string;
  title: string;
  document_type: DocumentType;
  original_filename: string;
  content_type: string;
  file_size: number;
  checksum_sha256?: string;
}

export interface UploadIntentResponse {
  document: Pick<
    Document,
    "id" | "family_id" | "family_member_id" | "title" | "document_type" | "status" | "original_filename" | "content_type" | "file_size"
  >;
  upload: {
    storage_key: string;
    upload_url: string;
    expires_at: string;
    required_headers: Record<string, string>;
  };
}

export interface UploadCompleteRequest {
  checksum_sha256?: string;
}

export interface UploadCompleteResponse {
  document: Pick<Document, "id" | "status">;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_at: string;
}

export type ParseJobStatus = "queued" | "processing" | "completed" | "failed";

export interface ParseJob {
  id: string;
  document_id: string;
  status: ParseJobStatus;
  parser_version: string | null;
  ocr_provider: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ParseJobCreateResponse {
  parse_job_id: string;
  document_id: string;
  status: ParseJobStatus;
  created_at: string;
}

export type MedicalParseJobStatus = "queued" | "processing" | "completed" | "failed";

export interface MedicalParseJobCreateResponse {
  medical_parse_job_id?: string;
  parse_job_id?: string;
  document_id: string;
  status: MedicalParseJobStatus;
  created_at: string;
}

export type ParserRunStatus = "started" | "completed" | "failed";

export interface ParserRun {
  id: string;
  document_id: string;
  parse_job_id: string | null;
  ocr_run_id: string;
  parser_version: string;
  status: ParserRunStatus;
  parsed_count: number;
  attention_count: number;
  ignored_count: number;
  average_confidence: number | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ParsedResult {
  id: string;
  document_id: string;
  family_id: string;
  family_member_id: string;
  canonical_metric_id: string;
  display_name: string;
  category: string;
  value_type: string;
  numeric_value: number | null;
  text_value: string | null;
  operator: string | null;
  unit: string | null;
  original_unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  reference_text: string | null;
  range_source: string | null;
  result_flag: string | null;
  parser_confidence: number;
  ocr_confidence: number | null;
  status: string;
  parser_version: string;
  measured_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AttentionItemStatus = "open" | "accepted" | "rejected" | "resolved";

export interface AttentionItem {
  id: string;
  document_id: string;
  family_id: string;
  family_member_id: string;
  reason_code: string;
  reason_message: string;
  raw_text: string;
  normalized_text: string | null;
  suggested_metric_id: string | null;
  suggested_display_name: string | null;
  suggested_value: string | null;
  suggested_unit: string | null;
  parser_confidence: number | null;
  status: AttentionItemStatus;
  created_at: string;
  updated_at: string;
}

export interface AttentionPatchRequest {
  status: Exclude<AttentionItemStatus, "open">;
}

export interface MemberAttentionItem {
  id: string;
  source: "attention_item" | "parsed_result";
  canonical_metric_id: string | null;
  display_name: string | null;
  value: string | null;
  unit: string | null;
  flag: string | null;
  reason_code: string;
  document_id: string;
  status: string;
  created_at: string;
}

export interface MemberAttentionListResponse {
  member_id: string;
  items: MemberAttentionItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardResponse {
  family_id: string;
  member_id: string;
  health_summary: HealthSummary;
  needs_attention: DashboardAttentionItem[];
  quick_actions: string[];
  trend_previews: TrendPreview[];
  latest_reports: LatestReport[];
}

export interface HealthSummary {
  score: number;
  status_sentence: string;
  score_note: string;
  normal_count: number;
  attention_count: number;
  critical_count: number;
  last_report?: {
    document_id: string;
    title: string;
    date: string;
    status: string;
  };
}

export interface DashboardAttentionItem {
  id: string;
  source: string;
  canonical_metric_id: string | null;
  display_name: string | null;
  value: string | null;
  unit: string | null;
  flag: string | null;
  reason_code: string;
  document_id: string;
  created_at: string;
}

export interface TrendPreview {
  canonical_metric_id: string;
  display_name: string;
  latest_value: number | null;
  unit: string | null;
  delta_from_previous: number | null;
  sparkline: { date: string; value: number }[];
}

export interface LatestReport {
  document_id: string;
  title: string;
  document_type: string;
  status: string;
  created_at: string;
  attention_count: number;
  parsed_count: number;
}

export interface TrendsListResponse {
  member_id: string;
  categories: TrendCategoryGroup[];
}

export interface TrendCategoryGroup {
  category: string;
  display_name: string;
  metrics: TrendMetricPreview[];
}

export interface TrendMetricPreview {
  canonical_metric_id: string;
  display_name: string;
  unit: string | null;
  latest_value: number | null;
  latest_date: string | null;
  reading_count: number;
  latest_flag: string | null;
  has_attention: boolean;
  sparkline: { date: string; value: number }[];
}

export type TrendRange = "week" | "month" | "6m" | "year" | "all";

export interface TrendDetailResponse {
  canonical_metric_id: string;
  display_name: string;
  category: string;
  unit: string | null;
  range: string;
  latest: {
    value: number | null;
    unit: string | null;
    date: string;
    flag: string | null;
    document_id: string;
  } | null;
  points: TrendPoint[];
  summary: {
    reading_count: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    change_from_previous: number | null;
  };
  unit_warning: string | null;
}

export interface TrendPoint {
  id: string;
  date: string;
  value: number | null;
  unit: string | null;
  flag: string | null;
  reference_min: number | null;
  reference_max: number | null;
  document_id: string;
  parsed_result_id: string;
  evidence_id: string | null;
  page_number: number | null;
}

export interface BloodPressureTrendResponse {
  canonical_metric_id: "blood_pressure";
  display_name: string;
  unit: string;
  range: string;
  points: BloodPressureTrendPoint[];
  summary: {
    reading_count: number;
    average_systolic: number | null;
    average_diastolic: number | null;
    highest_systolic: number | null;
    highest_diastolic: number | null;
  };
  unit_warning: string | null;
}

export interface BloodPressureTrendPoint {
  date: string;
  systolic: number;
  diastolic: number;
  unit: string;
  document_id: string;
  systolic_result_id: string;
  diastolic_result_id: string;
  evidence_id: string | null;
  page_number: number | null;
}

export type FamilyInviteStatus = "pending" | "accepted" | "rejected" | "revoked" | "expired";
export type InviteEmailDeliveryStatus = "not_sent" | "sent" | "failed" | "skipped";

export interface InviteCreateRequest {
  email: string;
  role: Exclude<FamilyRoleType, "owner">;
  expires_in_days?: number;
}

export interface FamilyInvite {
  id: string;
  family_id: string;
  invited_email: string;
  role: FamilyRoleType;
  status: FamilyInviteStatus;
  expires_at: string;
  created_at: string;
  email_delivery_status: InviteEmailDeliveryStatus;
  email_sent_at: string | null;
}

export interface InviteCreateResponse extends FamilyInvite {
  invite_token?: string | null;
}

export interface InviteAcceptRequest {
  invite_token: string;
}

export interface APIErrorResponse {
  detail: {
    code: string;
    message: string;
    errors?: unknown[];
  };
}
