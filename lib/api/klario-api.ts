import { apiFetch } from "@/lib/api/client";
import type {
  AccountDeletionPreview,
  AccountDeletionRequestCreate,
  AccountDeletionRequestResponse,
  AccountReauthenticationProof,
  AccountReauthenticationRequest,
  AccountSessionListResponse,
  AccountSummaryResponse,
  AttentionItem,
  AttentionPatchRequest,
  BloodPressureTrendResponse,
  ChangePasswordRequest,
  DashboardResponse,
  Document as KlarioDocument,
  DocumentUpdateRequest,
  DownloadUrlResponse,
  Family,
  FamilyCreateRequest,
  FamilyInvite,
  FamilyMember,
  FamilyProfileDetail,
  FamilyProfileUpdate,
  FamilyRole,
  FamilyRoleType,
  ForgotPasswordRequest,
  FamilyUpdateRequest,
  InviteAcceptRequest,
  InviteCreateRequest,
  InviteCreateResponse,
  LoginRequest,
  MedicalParseJobCreateResponse,
  MemberAttentionListResponse,
  MemberCreateRequest,
  MemberUpdateRequest,
  MetricCatalogItem,
  MetricCategoryListResponse,
  OnboardingDependentCreate,
  OnboardingDependentResponse,
  OnboardingFamilyCreate,
  OnboardingFamilyResponse,
  OnboardingInviteCreate,
  OnboardingProfileUpdate,
  OnboardingStatusResponse,
  OtpRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  ParseJobCreateResponse,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  PasswordResetResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ReportDetail,
  ReportListResponse,
  ReportPublicStatus,
  ReportSort,
  ReportSummary,
  ReportUpdateRequest,
  RevokeOtherSessionsResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  SecurityEventListResponse,
  SecurityAlertPreferences,
  SecurityAlertPreferencesUpdate,
  NotificationPreferencesResponse,
  NotificationPreferencesUpdateRequest,
  TokenResponse,
  TrackedMetricCreate,
  TrackedMetricResponse,
  TrendDetailResponse,
  TrendRange,
  TrendsListResponse,
  UnitPreferencesResponse,
  UnitPreferencesUpdateRequest,
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadIntentRequest,
  UploadIntentResponse,
  User
} from "@/lib/api/types";

export const authApi = {
  register: (body: RegisterRequest) =>
    apiFetch<OtpRequestResponse>("/auth/register", { method: "POST", body, auth: false }),
  login: (body: LoginRequest) =>
    apiFetch<OtpRequestResponse>("/auth/login", { method: "POST", body, auth: false }),
  requestOtp: (body: OtpRequest) => apiFetch<OtpRequestResponse>("/auth/otp/request", { method: "POST", body, auth: false }),
  verifyOtp: (body: OtpVerifyRequest) => apiFetch<TokenResponse>("/auth/otp/verify", { method: "POST", body, auth: false }),
  refresh: (body: RefreshTokenRequest) => apiFetch<TokenResponse>("/auth/refresh", { method: "POST", body, auth: false }),
  logout: (body: RefreshTokenRequest) => apiFetch<void>("/auth/logout", { method: "POST", body, auth: false }),
  changePassword: (body: ChangePasswordRequest) => apiFetch<TokenResponse>("/auth/change-password", { method: "POST", body }),
  forgotPassword: (body: ForgotPasswordRequest) =>
    apiFetch<PasswordResetResponse>("/auth/forgot-password", { method: "POST", body, auth: false }),
  requestForgotPasswordCode: (body: ForgotPasswordRequest) =>
    apiFetch<OtpRequestResponse>("/auth/forgot-password/request", { method: "POST", body, auth: false }),
  verifyForgotPasswordCode: (body: PasswordResetVerifyRequest) =>
    apiFetch<PasswordResetResponse>("/auth/forgot-password/verify", { method: "POST", body, auth: false }),
  resetForgotPassword: (body: PasswordResetRequest) =>
    apiFetch<PasswordResetResponse>("/auth/forgot-password/reset", { method: "POST", body, auth: false }),
  resetPassword: (body: PasswordResetRequest) =>
    apiFetch<PasswordResetResponse>("/auth/reset-password", { method: "POST", body, auth: false }),
  me: () => apiFetch<User>("/users/me"),
  authMe: () => apiFetch<User>("/auth/me")
};

export const accountApi = {
  get: () => apiFetch<AccountSummaryResponse>("/account"),
  sessions: () => apiFetch<AccountSessionListResponse>("/account/sessions"),
  revokeSession: (sessionId: string) => apiFetch<void>(`/account/sessions/${sessionId}`, { method: "DELETE" }),
  revokeOtherSessions: () => apiFetch<RevokeOtherSessionsResponse>("/account/sessions/revoke-others", { method: "POST" }),
  securityEvents: (params: { limit?: number; before?: string } = {}) =>
    apiFetch<SecurityEventListResponse>(withQuery("/account/security-events", params)),
  notificationPreferences: () => apiFetch<NotificationPreferencesResponse>("/account/notification-preferences"),
  updateNotificationPreferences: (body: NotificationPreferencesUpdateRequest) =>
    apiFetch<NotificationPreferencesResponse>("/account/notification-preferences", { method: "PATCH", body }),
  securityAlertPreferences: () => apiFetch<SecurityAlertPreferences>("/account/security-alert-preferences"),
  updateSecurityAlertPreferences: (body: SecurityAlertPreferencesUpdate) =>
    apiFetch<SecurityAlertPreferences>("/account/security-alert-preferences", { method: "PATCH", body }),
  unitPreferences: () => apiFetch<UnitPreferencesResponse>("/account/unit-preferences"),
  updateUnitPreferences: (body: UnitPreferencesUpdateRequest) =>
    apiFetch<UnitPreferencesResponse>("/account/unit-preferences", { method: "PATCH", body }),
  deletionPreview: () => apiFetch<AccountDeletionPreview>("/account/deletion-preview"),
  reauthenticate: (body: AccountReauthenticationRequest) =>
    apiFetch<AccountReauthenticationProof>("/account/reauthenticate", { method: "POST", body }),
  requestDeletion: (body: AccountDeletionRequestCreate) =>
    apiFetch<AccountDeletionRequestResponse>("/account/deletion-requests", { method: "POST", body })
};

export const onboardingApi = {
  status: () => apiFetch<OnboardingStatusResponse>("/onboarding/status"),
  updateProfile: (body: OnboardingProfileUpdate) =>
    apiFetch<OnboardingStatusResponse>("/onboarding/profile", { method: "PATCH", body }),
  createFamily: (body: OnboardingFamilyCreate) =>
    apiFetch<OnboardingFamilyResponse>("/onboarding/family", { method: "POST", body }),
  createDependent: (body: OnboardingDependentCreate) =>
    apiFetch<OnboardingDependentResponse>("/onboarding/dependents", { method: "POST", body }),
  createInvite: (body: OnboardingInviteCreate) =>
    apiFetch<InviteCreateResponse>("/onboarding/invites", { method: "POST", body }),
  complete: () => apiFetch<OnboardingStatusResponse>("/onboarding/complete", { method: "POST" })
};

export const familiesApi = {
  create: (body: FamilyCreateRequest) => apiFetch<Family>("/families", { method: "POST", body }),
  list: () => apiFetch<Family[]>("/families"),
  get: (familyId: string) => apiFetch<Family>(`/families/${familyId}`),
  update: (familyId: string, body: FamilyUpdateRequest) => apiFetch<Family>(`/families/${familyId}`, { method: "PATCH", body }),
  delete: (familyId: string) => apiFetch<void>(`/families/${familyId}`, { method: "DELETE" })
};

export const membersApi = {
  create: (familyId: string, body: MemberCreateRequest) => apiFetch<FamilyMember>(`/families/${familyId}/members`, { method: "POST", body }),
  list: (familyId: string) => apiFetch<FamilyMember[]>(`/families/${familyId}/members`),
  get: (memberId: string) => apiFetch<FamilyMember>(`/members/${memberId}`),
  update: (memberId: string, body: MemberUpdateRequest) => apiFetch<FamilyMember>(`/members/${memberId}`, { method: "PATCH", body }),
  delete: (memberId: string) => apiFetch<void>(`/members/${memberId}`, { method: "DELETE" })
};

export const rolesApi = {
  list: (familyId: string) => apiFetch<FamilyRole[]>(`/families/${familyId}/roles`),
  create: (familyId: string, body: RoleCreateRequest) => apiFetch<FamilyRole>(`/families/${familyId}/roles`, { method: "POST", body }),
  update: (familyId: string, roleId: string, body: RoleUpdateRequest) =>
    apiFetch<FamilyRole>(`/families/${familyId}/roles/${roleId}`, { method: "PATCH", body })
};

export const documentsApi = {
  list: (familyId: string) => apiFetch<KlarioDocument[]>(`/families/${familyId}/documents`),
  get: (documentId: string) => apiFetch<KlarioDocument>(`/documents/${documentId}`),
  update: (documentId: string, body: DocumentUpdateRequest) => apiFetch<KlarioDocument>(`/documents/${documentId}`, { method: "PATCH", body }),
  delete: (documentId: string) => apiFetch<void>(`/documents/${documentId}`, { method: "DELETE" }),
  uploadIntent: (familyId: string, body: UploadIntentRequest) =>
    apiFetch<UploadIntentResponse>(`/families/${familyId}/documents/upload-intent`, { method: "POST", body }),
  uploadComplete: (documentId: string, body: UploadCompleteRequest) =>
    apiFetch<UploadCompleteResponse>(`/documents/${documentId}/upload-complete`, { method: "POST", body }),
  downloadUrl: (documentId: string) => apiFetch<DownloadUrlResponse>(`/documents/${documentId}/download-url`)
};

export const parseApi = {
  createOcrJob: (documentId: string) => apiFetch<ParseJobCreateResponse>(`/documents/${documentId}/parse-jobs`, { method: "POST" }),
  createMedicalJob: (documentId: string) =>
    apiFetch<MedicalParseJobCreateResponse>(`/documents/${documentId}/medical-parse-jobs`, { method: "POST" })
};

export const reportsApi = {
  list: (
    familyId: string,
    params: {
      member_id?: string;
      report_type?: string;
      status?: ReportPublicStatus;
      search?: string;
      sort?: ReportSort;
      date_from?: string;
      date_to?: string;
      cursor?: string;
      limit?: number;
      include_archived?: boolean;
      updated_since?: string;
    } = {}
  ) => apiFetch<ReportListResponse>(withQuery(`/families/${familyId}/reports`, params)),
  get: (familyId: string, reportId: string) => apiFetch<ReportSummary>(`/families/${familyId}/reports/${reportId}`),
  detail: (familyId: string, reportId: string) => apiFetch<ReportDetail>(`/families/${familyId}/reports/${reportId}/detail`),
  update: (familyId: string, reportId: string, body: ReportUpdateRequest) =>
    apiFetch<ReportDetail>(`/families/${familyId}/reports/${reportId}`, {
      method: "PATCH",
      body,
      headers: {
        "Idempotency-Key": crypto.randomUUID(),
        "X-Klario-Edit-Source": "web"
      }
    }),
  retry: (familyId: string, reportId: string) =>
    apiFetch<ReportSummary>(`/families/${familyId}/reports/${reportId}/retry`, { method: "POST" }),
  archive: (familyId: string, reportId: string) =>
    apiFetch<ReportSummary>(`/families/${familyId}/reports/${reportId}/archive`, { method: "POST" }),
  restore: (familyId: string, reportId: string) =>
    apiFetch<ReportSummary>(`/families/${familyId}/reports/${reportId}/restore`, { method: "POST" })
};

export const dashboardApi = {
  get: (familyId: string, memberId: string) => apiFetch<DashboardResponse>(`/families/${familyId}/members/${memberId}/dashboard`),
  attention: (familyId: string, memberId: string, status = "open", limit = 20, offset = 0, classification = "all") =>
    apiFetch<MemberAttentionListResponse>(
      withQuery(`/families/${familyId}/members/${memberId}/attention-items`, { status, classification, limit, offset })
    )
};

export const trendsApi = {
  list: (familyId: string, memberId: string) => apiFetch<TrendsListResponse>(`/families/${familyId}/members/${memberId}/trends`),
  detail: (familyId: string, memberId: string, canonicalMetricId: string, range: TrendRange = "all") =>
    apiFetch<TrendDetailResponse | BloodPressureTrendResponse>(
      withQuery(`/families/${familyId}/members/${memberId}/trends/${canonicalMetricId}`, { range })
    )
};

export const metricsApi = {
  catalog: (params: { search?: string; category_id?: string } = {}) =>
    apiFetch<MetricCatalogItem[]>(withQuery("/metrics", params)),
  categories: (params: { search?: string; active_only?: boolean } = {}) =>
    apiFetch<MetricCategoryListResponse>(withQuery("/metric-categories", params)),
  tracked: (familyId: string, memberId: string) =>
    apiFetch<TrackedMetricResponse[]>(`/families/${familyId}/members/${memberId}/tracked-metrics`),
  track: (familyId: string, memberId: string, body: TrackedMetricCreate) =>
    apiFetch<TrackedMetricResponse>(`/families/${familyId}/members/${memberId}/tracked-metrics`, { method: "POST", body }),
  untrack: (familyId: string, memberId: string, canonicalMetricId: string) =>
    apiFetch<void>(`/families/${familyId}/members/${memberId}/tracked-metrics/${canonicalMetricId}`, { method: "DELETE" })
};

export const attentionApi = {
  update: (attentionItemId: string, body: AttentionPatchRequest) =>
    apiFetch<AttentionItem>(`/attention-items/${attentionItemId}`, { method: "PATCH", body })
};

export const invitesApi = {
  create: (familyId: string, body: InviteCreateRequest) => apiFetch<InviteCreateResponse>(`/families/${familyId}/invites`, { method: "POST", body }),
  list: (familyId: string) => apiFetch<FamilyInvite[]>(`/families/${familyId}/invites`),
  resend: (inviteId: string) => apiFetch<InviteCreateResponse>(`/family-invites/${inviteId}/resend`, { method: "POST" }),
  revoke: (inviteId: string) => apiFetch<FamilyInvite>(`/family-invites/${inviteId}/revoke`, { method: "POST" }),
  accept: (body: InviteAcceptRequest) => apiFetch<FamilyInvite>("/family-invites/accept", { method: "POST", body }),
  reject: (body: InviteAcceptRequest) => apiFetch<FamilyInvite>("/family-invites/reject", { method: "POST", body })
};

export const profilesApi = {
  list: (familyId: string, status: "active" | "archived" = "active") =>
    apiFetch<FamilyProfileDetail[]>(withQuery(`/families/${familyId}/profiles`, { status })),
  get: (familyId: string, profileId: string) => apiFetch<FamilyProfileDetail>(`/families/${familyId}/profiles/${profileId}`),
  update: (familyId: string, profileId: string, body: FamilyProfileUpdate) =>
    apiFetch<FamilyProfileDetail>(`/families/${familyId}/profiles/${profileId}`, { method: "PATCH", body }),
  archive: (familyId: string, profileId: string) =>
    apiFetch<FamilyProfileDetail>(`/families/${familyId}/profiles/${profileId}/archive`, { method: "POST" }),
  restore: (familyId: string, profileId: string) =>
    apiFetch<FamilyProfileDetail>(`/families/${familyId}/profiles/${profileId}/restore`, { method: "POST" })
};

export function canUpload(role: FamilyRoleType | null | undefined) {
  return role === "owner" || role === "admin" || role === "contributor";
}

export function canManageMembers(role: FamilyRoleType | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canManageInvites(role: FamilyRoleType | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canManageRoles(role: FamilyRoleType | null | undefined) {
  return role === "owner";
}

export function canResolveAttention(role: FamilyRoleType | null | undefined) {
  return role === "owner" || role === "admin" || role === "contributor";
}

export function inviteRoleOptions(role: FamilyRoleType | null | undefined): Exclude<FamilyRoleType, "owner">[] {
  if (role === "owner") return ["admin", "contributor", "viewer"];
  if (role === "admin") return ["contributor", "viewer"];
  return [];
}

function withQuery(path: string, params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
