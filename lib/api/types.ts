export interface OtpRequest {
  email: string;
  purpose: "login" | "register";
  password?: string;
  full_name?: string;
}

export interface OtpRequestResponse {
  message: string;
  expires_in_minutes: number;
  otp_code?: string | null;
}

export interface OtpVerifyRequest {
  email: string;
  code: string;
  purpose: "login" | "register";
  full_name?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface PasswordResetRequest {
  token: string;
  new_password: string;
}

export interface PasswordResetVerifyRequest {
  email: string;
  code: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
  reset_token?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_name?: string;
  device_type?: string;
  app_version?: string;
  os_version?: string;
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

export interface AuditLog {
  id: string;
  user_id: string | null;
  family_id: string | null;
  event_type: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
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

export type FamilyRelationship =
  | "self"
  | "spouse"
  | "mother"
  | "father"
  | "son"
  | "daughter"
  | "child"
  | "sibling"
  | "grandparent"
  | "relative"
  | "other";

export interface MemberCreateRequest {
  display_name: string;
  relationship: FamilyRelationship;
  relationship_other_label?: string | null;
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

export type OCRRunStatus = "started" | "completed" | "failed";

export interface OCRRun {
  id: string;
  document_id: string;
  provider: string;
  provider_model: string | null;
  status: OCRRunStatus;
  page_count: number | null;
  average_confidence: number | null;
  expected_document_page_count: number | null;
  ocr_pages_returned: number | null;
  ocr_chunking_enabled: boolean | null;
  ocr_chunk_size: number | null;
  ocr_chunk_count: number | null;
  partial_ocr: boolean | null;
  partial_ocr_warning: string | null;
  failed_chunk_index: number | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface OCRPage {
  id: string;
  ocr_run_id: string;
  document_id: string;
  page_number: number;
  raw_text: string | null;
  width: number | null;
  height: number | null;
  unit: string | null;
  confidence: number | null;
  created_at: string;
}

export type OCRBlockType = "line" | "word" | "table_cell" | "table_row" | "paragraph";

export interface OCRBlock {
  id: string;
  ocr_run_id: string;
  document_id: string;
  page_number: number;
  block_type: OCRBlockType;
  text: string;
  normalized_text: string | null;
  confidence: number | null;
  bounding_box_json: Record<string, unknown> | null;
  row_index: number | null;
  column_index: number | null;
  reading_order: number | null;
  created_at: string;
}

export interface OCRBlocksPaginatedResponse {
  items: OCRBlock[];
  total: number;
  page: number;
  page_size: number;
}

export interface OCRDebugDump {
  document_id: string;
  expected_document_page_count: number | null;
  ocr_pages_returned: number | null;
  ocr_chunking_enabled: boolean | null;
  ocr_chunk_size: number | null;
  ocr_chunk_count: number | null;
  partial_ocr: boolean | null;
  partial_ocr_warning: string | null;
  runs: OCRRun[];
  pages: OCRPage[];
  blocks: OCRBlock[];
  block_count: number;
  table_count: number;
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

export interface ParserDebugRow {
  row_text: string;
  source: string;
  page_number: number;
  matched_metric: string | null;
  match_type: string | null;
  suggested_display_name: string | null;
  suggested_value: string | null;
  suggested_unit: string | null;
  value: number | string | null;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
  confidence: number;
  decision: string;
  reason_code: string | null;
}

export interface ParserDebugSummary {
  parsed_count: number;
  unknown_medical_metric_count?: number;
  attention_count: number;
  ignored_count: number;
  document_medical_confidence: number | null;
  document_classification: string | null;
  attention_suppressed_count?: number;
  suppression_reasons?: Record<string, number>;
}

export interface ParserDebugDump {
  document_id: string;
  parser_run_id: string | null;
  expected_document_page_count: number | null;
  ocr_pages_returned: number | null;
  ocr_chunking_enabled: boolean | null;
  ocr_chunk_size: number | null;
  ocr_chunk_count: number | null;
  partial_ocr: boolean | null;
  partial_ocr_warning: string | null;
  rows: ParserDebugRow[];
  summary: ParserDebugSummary;
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
  classification?: string;
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
  banner?: string | null;
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
  has_readings?: boolean;
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

export interface LinkedPersonalProfile {
  family_id: string;
  family_member_id: string;
  display_name: string;
  relationship: string;
}

export interface AccountCapabilities {
  two_step_verification_available: boolean;
  account_deletion_available: boolean;
  data_export_available: boolean;
  push_notifications_available: boolean;
  connected_apps_available: boolean;
}

export interface AccountSummaryResponse {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  member_since: string;
  linked_personal_profile: LinkedPersonalProfile | null;
  capabilities: AccountCapabilities;
}

export interface AccountSession {
  id: string;
  device_name: string | null;
  device_type: string | null;
  app_version: string | null;
  os_version: string | null;
  created_at: string;
  last_active_at: string | null;
  expires_at: string;
  is_current: boolean;
}

export interface AccountSessionListResponse {
  sessions: AccountSession[];
}

export interface RevokeOtherSessionsResponse {
  revoked_count: number;
}

export interface SecurityEventListResponse {
  events: AuditLog[];
  next_cursor: string | null;
}

export interface SecurityAlertPreferences {
  alert_new_device_login: boolean;
  alert_password_changed: boolean;
  alert_session_revoked: boolean;
  alert_family_role_changed: boolean;
  alert_family_access_removed: boolean;
  alert_delivery_email: boolean;
  alert_delivery_push: boolean;
}

export type SecurityAlertPreferencesUpdate = Partial<SecurityAlertPreferences>;

export interface NotificationDeliveryPreferences {
  email: boolean;
  push: boolean;
}

export interface NotificationDeliveryPreferencesUpdate {
  email?: boolean | null;
  push?: boolean | null;
}

export interface QuietHoursPreferences {
  enabled: boolean;
  start: string | null;
  end: string | null;
  timezone: string | null;
}

export interface QuietHoursPreferencesUpdate {
  enabled?: boolean | null;
  start?: string | null;
  end?: string | null;
  timezone?: string | null;
}

export interface NotificationCapabilities {
  email_delivery_available: boolean;
  push_delivery_available: boolean;
  reminders_available: boolean;
  quiet_hours_available: boolean;
  event_notifications_wired: boolean;
}

export interface NotificationPreferencesResponse {
  report_processing_completed: boolean;
  family_invitation_received: boolean;
  family_invitation_accepted: boolean;
  shared_report_available: boolean;
  reminders_enabled: boolean;
  delivery: NotificationDeliveryPreferences;
  quiet_hours: QuietHoursPreferences;
  capabilities: NotificationCapabilities;
  updated_at: string;
}

export interface NotificationPreferencesUpdateRequest {
  report_processing_completed?: boolean | null;
  family_invitation_received?: boolean | null;
  family_invitation_accepted?: boolean | null;
  shared_report_available?: boolean | null;
  reminders_enabled?: boolean | null;
  delivery?: NotificationDeliveryPreferencesUpdate | null;
  quiet_hours?: QuietHoursPreferencesUpdate | null;
}

export type UnitHeight = "cm" | "ft_in";
export type UnitWeight = "kg" | "lb";
export type UnitTemperature = "celsius" | "fahrenheit";
export type UnitGlucose = "mmol_l" | "mg_dl";
export type DisplayTrendsRange = "week" | "month" | "quarter" | "year";

export interface DisplayPreferences {
  unit_height: UnitHeight;
  unit_weight: UnitWeight;
  unit_temperature: UnitTemperature;
  unit_glucose: UnitGlucose;
  default_trends_range: DisplayTrendsRange;
  show_flagged_first: boolean;
}

export type DisplayPreferencesUpdate = Partial<DisplayPreferences>;

export interface UnitPreferencesResponse {
  height_unit: UnitHeight;
  weight_unit: UnitWeight;
  temperature_unit: UnitTemperature;
  glucose_unit: UnitGlucose;
  updated_at: string;
}

export interface UnitPreferencesUpdateRequest {
  height_unit?: UnitHeight | null;
  weight_unit?: UnitWeight | null;
  temperature_unit?: UnitTemperature | null;
  glucose_unit?: UnitGlucose | null;
}

export interface AccountDeletionPreview {
  can_delete: boolean;
  blocking_reason: string | null;
  family_role: string | null;
  belongs_to_family: boolean;
  owns_family: boolean;
  requires_ownership_transfer: boolean;
  managed_profile_count: number;
  independent_family_member_count: number;
  data_categories: string[];
  shared_data_preserved: boolean;
}

export interface AccountReauthenticationRequest {
  password: string;
}

export interface AccountReauthenticationProof {
  reauthentication_token: string;
  purpose: string;
  expires_at: string;
}

export interface AccountDeletionRequestCreate {
  confirmation: "DELETE";
  reauthentication_token: string;
  idempotency_key: string;
}

export interface AccountDeletionRequestResponse {
  request_id: string;
  status: "accepted" | "processing" | "completed" | "failed";
}

export type OnboardingNextStep = "verify_email" | "profile" | "family_setup" | "add_people" | "completed";

export interface OnboardingStatusResponse {
  email: string;
  email_verified: boolean;
  profile_completed: boolean;
  family_setup_completed: boolean;
  onboarding_completed: boolean;
  next_step: OnboardingNextStep;
  family_id: string | null;
  profile_id: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: ProfileGender | null;
  phone_number: string | null;
  blood_group: BloodGroup | null;
  height_cm: number | null;
  weight_kg: number | null;
  completed_at: string | null;
}

export interface OnboardingProfileUpdate {
  full_name: string;
  date_of_birth: string;
  gender: ProfileGender;
  phone_number?: string | null;
  blood_group?: BloodGroup | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface OnboardingFamilyCreate {
  name: string;
}

export interface OnboardingFamilyResponse {
  family_id: string;
  profile_id: string;
  family_name: string;
  owner_membership_id: string;
}

export interface OnboardingDependentCreate {
  full_name: string;
  relationship: FamilyRelationship;
  relationship_other_label?: string | null;
  date_of_birth?: string | null;
  gender?: ProfileGender | null;
  phone_number?: string | null;
  contact_email?: string | null;
  blood_group?: BloodGroup | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface OnboardingDependentResponse {
  profile_id: string;
  full_name: string;
}

export interface OnboardingInviteCreate {
  email: string;
  role: FamilyRoleType;
  message?: string | null;
}

export interface MetricCatalogItem {
  canonical_id: string;
  display_name: string;
  category: string;
  aliases: string[];
  supported_units: string[];
  value_type: string;
  requires_unit: boolean;
  report_range_only: boolean;
}

export interface MetricCategory {
  category_id: string;
  display_name: string;
  metric_count: number;
  sort_order: number;
  is_active: boolean;
}

export interface MetricCategoryListResponse {
  categories: MetricCategory[];
}

export interface TrackedMetricCreate {
  canonical_metric_id: string;
}

export interface TrackedMetricResponse {
  id: string;
  family_member_id: string;
  canonical_metric_id: string;
  created_at: string;
}

export interface TrendPreferencesResponse {
  member_id: string;
  hidden_metric_ids: string[];
  hidden_category_ids: string[];
  tracked_metric_ids: string[];
  updated_at: string | null;
}

export type ReminderType = "custom" | "report_follow_up" | "appointment" | "health_check";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom_weekdays";
export type DeliveryChannel = "email" | "push";

export interface RecurrenceRuleRequest {
  frequency: RecurrenceFrequency;
  interval?: number;
  weekdays?: string[] | null;
  end_at?: string | null;
}

export interface RecurrenceRuleResponse {
  frequency: string;
  interval: number;
  weekdays: string[] | null;
  end_at: string | null;
}

export interface ReminderProfileSummary {
  id: string;
  display_name: string;
}

export interface ReminderScheduleResponse {
  scheduled_at: string | null;
  timezone: string;
  recurrence: RecurrenceRuleResponse | null;
}

export interface ReminderCreateRequest {
  title: string;
  notes?: string | null;
  reminder_type?: ReminderType;
  family_member_id?: string | null;
  scheduled_at?: string | null;
  timezone: string;
  recurrence?: RecurrenceRuleRequest | null;
  delivery_channels: DeliveryChannel[];
  is_enabled?: boolean;
}

export interface ReminderUpdateRequest {
  title?: string | null;
  notes?: string | null;
  reminder_type?: ReminderType | null;
  family_member_id?: string | null;
  scheduled_at?: string | null;
  timezone?: string | null;
  recurrence?: RecurrenceRuleRequest | null;
  delivery_channels?: DeliveryChannel[] | null;
  is_enabled?: boolean | null;
}

export interface ReminderResponse {
  id: string;
  title: string;
  notes: string | null;
  reminder_type: string;
  profile: ReminderProfileSummary | null;
  schedule: ReminderScheduleResponse;
  delivery_channels: string[];
  is_enabled: boolean;
  next_trigger_at: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderListResponse {
  reminders: ReminderResponse[];
  next_cursor: string | null;
}

export type ProfileGender = "female" | "male" | "other" | "prefer_not_to_say";
export type ProfileStatus = "active" | "archived";
export type BloodGroup = "a_positive" | "a_negative" | "b_positive" | "b_negative" | "ab_positive" | "ab_negative" | "o_positive" | "o_negative";

export interface ProfileCapabilities {
  can_view_profile: boolean;
  can_edit_profile: boolean;
  can_change_profile_photo: boolean;
  can_link_account: boolean;
  can_unlink_account: boolean;
  can_archive_profile: boolean;
  can_restore_profile: boolean;
}

export interface LinkedFamilyAccount {
  membership_id: string;
  display_name: string;
  email: string;
  role: FamilyRoleType;
}

export type EligibleFamilyAccount = LinkedFamilyAccount;

export interface FamilyProfileDetail {
  id: string;
  family_id: string;
  full_name: string;
  date_of_birth: string | null;
  age: number | null;
  age_months: number | null;
  gender: ProfileGender | null;
  relationship: string;
  relationship_other_label: string | null;
  phone_number: string | null;
  contact_email: string | null;
  blood_group: BloodGroup | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_photo_url: string | null;
  status: ProfileStatus;
  linked_account: LinkedFamilyAccount | null;
  capabilities: ProfileCapabilities;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface FamilyProfileUpdate {
  full_name?: string | null;
  date_of_birth?: string | null;
  gender?: ProfileGender | null;
  relationship?: FamilyRelationship | null;
  relationship_other_label?: string | null;
  phone_number?: string | null;
  contact_email?: string | null;
  blood_group?: BloodGroup | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  expected_updated_at?: string | null;
}

export interface ProfilePhotoUploadIntentRequest {
  content_type: string;
  file_size: number;
  checksum_sha256?: string | null;
}

export interface ProfilePhotoUploadIntentResponse {
  storage_key: string;
  upload_url: string;
  expires_at: string;
  required_headers: Record<string, string>;
}

export interface ProfilePhotoUploadCompleteRequest {
  checksum_sha256?: string | null;
}

export interface LinkProfileAccountRequest {
  membership_id: string;
}

export type ReportPublicStatus = "uploading" | "queued" | "processing" | "needs_review" | "ready" | "failed" | "archived";
export type ReportSort = "recent" | "oldest" | "name_asc" | "name_desc" | "status";
export type ReportDateSource = "document" | "uploaded" | "parsed" | "unknown";

export interface ReportMemberSummary {
  id: string;
  display_name: string;
}

export interface ReportTypeSummary {
  id: string;
  display_name: string;
}

export interface ReportProgress {
  stage: string;
  fraction: number | null;
  completed_pages: number | null;
  total_pages: number | null;
  message: string;
}

export interface ReportReviewSummary {
  required: boolean;
  attention_count: number;
  route_available: boolean;
}

export interface ReportCapabilities {
  can_view: boolean;
  can_review: boolean;
  can_retry: boolean;
  can_rename: boolean;
  can_archive: boolean;
  can_restore: boolean;
  can_delete: boolean;
}

export interface ReportSummary {
  id: string;
  display_name: string;
  original_filename: string;
  family_id: string;
  member: ReportMemberSummary;
  report_type: ReportTypeSummary;
  status: ReportPublicStatus;
  status_label: string;
  status_message: string;
  status_reason_codes: string[];
  progress: ReportProgress | null;
  attention_count: number;
  review_required: boolean;
  review_route_available: boolean;
  review: ReportReviewSummary;
  uploaded_at: string | null;
  document_date: string | null;
  updated_at: string;
  processing_completed_at: string | null;
  display_date: string | null;
  display_date_source: ReportDateSource;
  can_retry: boolean;
  can_rename: boolean;
  can_archive: boolean;
  can_delete: boolean;
  capabilities: ReportCapabilities;
}

export interface ReportsOverview {
  all: number;
  ready: number;
  needs_review: number;
  processing: number;
  failed: number;
  archived: number;
}

export interface ReportListResponse {
  items: ReportSummary[];
  summary: ReportsOverview;
  page: {
    next_cursor: string | null;
    has_more: boolean;
    limit: number;
  };
  applied_filters: {
    member_id: string | null;
    report_type: string | null;
    status: ReportPublicStatus | null;
    search: string | null;
    sort: ReportSort;
    date_from: string | null;
    date_to: string | null;
    include_archived: boolean;
  };
  generated_at: string;
  has_active_reports: boolean;
}

export interface ReportResultDetail {
  id: string;
  canonical_metric_id: string;
  name: string;
  parser_name: string;
  category: string;
  value_type: string;
  parsed_value: string | null;
  user_corrected_value: string | null;
  effective_value: string | null;
  value_source: string;
  unit: string | null;
  parser_unit: string | null;
  reference_range: string | null;
  parser_reference_range: string | null;
  result_flag: string | null;
  parser_result_flag: string | null;
  measured_at: string | null;
  correction_note: string | null;
  corrected_at: string | null;
  parser_confidence: number;
  ocr_confidence: number | null;
  parser_version: string;
  status: string;
  can_edit: boolean;
}

export interface ReportDetail extends ReportSummary {
  version: number;
  provider_name: string | null;
  notes: string | null;
  tags: string[];
  category: DocumentType;
  can_edit: boolean;
  results: ReportResultDetail[];
}

export interface ReportResultUpdate {
  id: string;
  restore_parser_value?: boolean;
  display_name?: string | null;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  result_flag?: string | null;
  measured_at?: string | null;
  note?: string | null;
}

export interface ReportUpdateRequest {
  version: number;
  display_name?: string | null;
  document_date?: string | null;
  provider_name?: string | null;
  category?: DocumentType | null;
  family_member_id?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  results?: ReportResultUpdate[] | null;
}

export interface APIErrorResponse {
  detail: {
    code: string;
    message: string;
    errors?: unknown[];
  };
}

export type HealthReadyResponse = Record<string, unknown>;
