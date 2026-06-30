import { apiFetch, getApiRootUrl } from "@/lib/api/client";
import type {
  AttentionItem,
  AttentionPatchRequest,
  BloodPressureTrendResponse,
  DashboardResponse,
  Document as KlarioDocument,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DownloadUrlResponse,
  Family,
  FamilyCreateRequest,
  FamilyInvite,
  FamilyMember,
  FamilyRole,
  FamilyRoleType,
  FamilyUpdateRequest,
  InviteAcceptRequest,
  InviteCreateRequest,
  InviteCreateResponse,
  LoginRequest,
  MedicalParseJobCreateResponse,
  MemberAttentionListResponse,
  MemberCreateRequest,
  MemberUpdateRequest,
  ParseJob,
  ParseJobCreateResponse,
  ParsedResult,
  ParserRun,
  RegisterRequest,
  RoleCreateRequest,
  RoleUpdateRequest,
  TokenResponse,
  TrendDetailResponse,
  TrendRange,
  TrendsListResponse,
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadIntentRequest,
  UploadIntentResponse,
  User
} from "@/lib/api/types";

export const authApi = {
  register: (body: RegisterRequest) => apiFetch<User>("/auth/register", { method: "POST", body, auth: false }),
  login: (body: LoginRequest) => apiFetch<TokenResponse>("/auth/login", { method: "POST", body, auth: false }),
  me: () => apiFetch<User>("/users/me")
};

export const familiesApi = {
  create: (body: FamilyCreateRequest) => apiFetch<Family>("/families", { method: "POST", body }),
  list: () => apiFetch<Family[]>("/families"),
  get: (familyId: string) => apiFetch<Family>(`/families/${familyId}`),
  update: (familyId: string, body: FamilyUpdateRequest) => apiFetch<Family>(`/families/${familyId}`, { method: "PATCH", body })
};

export const membersApi = {
  create: (familyId: string, body: MemberCreateRequest) => apiFetch<FamilyMember>(`/families/${familyId}/members`, { method: "POST", body }),
  list: (familyId: string) => apiFetch<FamilyMember[]>(`/families/${familyId}/members`),
  get: (memberId: string) => apiFetch<FamilyMember>(`/members/${memberId}`),
  update: (memberId: string, body: MemberUpdateRequest) => apiFetch<FamilyMember>(`/members/${memberId}`, { method: "PATCH", body })
};

export const rolesApi = {
  list: (familyId: string) => apiFetch<FamilyRole[]>(`/families/${familyId}/roles`),
  create: (familyId: string, body: RoleCreateRequest) => apiFetch<FamilyRole>(`/families/${familyId}/roles`, { method: "POST", body }),
  update: (familyId: string, roleId: string, body: RoleUpdateRequest) =>
    apiFetch<FamilyRole>(`/families/${familyId}/roles/${roleId}`, { method: "PATCH", body })
};

export const documentsApi = {
  create: (familyId: string, body: DocumentCreateRequest) => apiFetch<KlarioDocument>(`/families/${familyId}/documents`, { method: "POST", body }),
  list: (familyId: string) => apiFetch<KlarioDocument[]>(`/families/${familyId}/documents`),
  get: (documentId: string) => apiFetch<KlarioDocument>(`/documents/${documentId}`),
  update: (documentId: string, body: DocumentUpdateRequest) => apiFetch<KlarioDocument>(`/documents/${documentId}`, { method: "PATCH", body }),
  uploadIntent: (familyId: string, body: UploadIntentRequest) =>
    apiFetch<UploadIntentResponse>(`/families/${familyId}/documents/upload-intent`, { method: "POST", body }),
  uploadComplete: (documentId: string, body: UploadCompleteRequest) =>
    apiFetch<UploadCompleteResponse>(`/documents/${documentId}/upload-complete`, { method: "POST", body }),
  downloadUrl: (documentId: string) => apiFetch<DownloadUrlResponse>(`/documents/${documentId}/download-url`)
};

export const parseApi = {
  createOcrJob: (documentId: string) => apiFetch<ParseJobCreateResponse>(`/documents/${documentId}/parse-jobs`, { method: "POST" }),
  listOcrJobs: (documentId: string) => apiFetch<ParseJob[]>(`/documents/${documentId}/parse-jobs`),
  getOcrJob: (parseJobId: string) => apiFetch<ParseJob>(`/parse-jobs/${parseJobId}`),
  createMedicalJob: (documentId: string) =>
    apiFetch<MedicalParseJobCreateResponse>(`/documents/${documentId}/medical-parse-jobs`, { method: "POST" }),
  listParserRuns: (documentId: string) => apiFetch<ParserRun[]>(`/documents/${documentId}/parser-runs`),
  listParsedResults: (documentId: string) => apiFetch<ParsedResult[]>(`/documents/${documentId}/parsed-results`),
  listDocumentAttentionItems: (documentId: string) => apiFetch<AttentionItem[]>(`/documents/${documentId}/attention-items`)
};

export const dashboardApi = {
  get: (familyId: string, memberId: string) => apiFetch<DashboardResponse>(`/families/${familyId}/members/${memberId}/dashboard`),
  attention: (familyId: string, memberId: string, status = "open", limit = 20, offset = 0) =>
    apiFetch<MemberAttentionListResponse>(
      withQuery(`/families/${familyId}/members/${memberId}/attention-items`, { status, limit, offset })
    )
};

export const trendsApi = {
  list: (familyId: string, memberId: string) => apiFetch<TrendsListResponse>(`/families/${familyId}/members/${memberId}/trends`),
  detail: (familyId: string, memberId: string, canonicalMetricId: string, range: TrendRange = "all") =>
    apiFetch<TrendDetailResponse | BloodPressureTrendResponse>(
      withQuery(`/families/${familyId}/members/${memberId}/trends/${canonicalMetricId}`, { range })
    )
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
  reject: (body: InviteAcceptRequest) => apiFetch<FamilyInvite>("/family-invites/reject", { method: "POST", body }),
  mine: () => apiFetch<FamilyInvite[]>("/me/invites")
};

export const healthApi = {
  check: async () => {
    const response = await fetch(`${getApiRootUrl().replace(/\/$/, "")}/health`, { cache: "no-store" });
    return response.ok;
  }
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
