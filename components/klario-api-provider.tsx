"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BioIcon } from "@/components/bio-icon";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  clearKlarioSession,
  getRefreshToken,
  getAuthToken,
  getEnvironmentLabel,
  getStoredActiveFamilyId,
  getStoredActiveMemberId,
  setAuthTokens,
  setStoredActiveFamilyId,
  setStoredActiveMemberId
} from "@/lib/api/client";
import { authApi, familiesApi, membersApi, onboardingApi, rolesApi } from "@/lib/api/klario-api";
import { protectedQueryKey, protectedQueryPrefix, queryFreshness } from "@/lib/query-cache";
import { uploadAndParseReport, type UploadAndParseOptions, type UploadPhase } from "@/lib/api/upload";
import type {
  Family,
  FamilyCreateRequest,
  FamilyMember,
  FamilyRole,
  FamilyRoleType,
  LoginRequest,
  OnboardingStatusResponse,
  MemberCreateRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  RegisterRequest,
  User
} from "@/lib/api/types";

type ApiStatus = "checking" | "signed-out" | "onboarding" | "live" | "offline";

type BackgroundUploadState = {
  id: number;
  phase: UploadPhase | "failed";
  message: string;
  tone: "progress" | "success" | "error";
  documentId?: string;
};

type BackgroundUploadRequest = Omit<UploadAndParseOptions, "onStatus">;

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

type KlarioApiContextValue = {
  status: ApiStatus;
  user: User | null;
  families: Family[];
  members: FamilyMember[];
  roles: FamilyRole[];
  activeFamily: Family | null;
  activeMember: FamilyMember | null;
  currentRole: FamilyRoleType | null;
  onboarding: OnboardingStatusResponse | null;
  environment: string;
  lastSyncAt: string | null;
  message: string | null;
  isSignedIn: boolean;
  setActiveFamilyId: (familyId: string | null) => Promise<void>;
  setActiveMemberId: (memberId: string | null) => void;
  login: (credentials: LoginRequest) => Promise<OtpRequestResponse>;
  completeOtpLogin: (request: OtpVerifyRequest) => Promise<User>;
  register: (request: RegisterRequest) => Promise<OtpRequestResponse>;
  logout: () => void;
  backendLogout: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshOnboarding: () => Promise<OnboardingStatusResponse | null>;
  createFamily: (request: FamilyCreateRequest) => Promise<Family>;
  createMember: (familyId: string, request: MemberCreateRequest) => Promise<FamilyMember>;
  invalidateWorkspaceData: () => Promise<void>;
  forgetDeletedDocument: (documentId: string) => Promise<void>;
  uploadState: BackgroundUploadState | null;
  startReportUpload: (request: BackgroundUploadRequest) => void;
  dismissUploadStatus: () => void;
};

const KlarioApiContext = createContext<KlarioApiContextValue | null>(null);

export function KlarioApiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            ...queryFreshness.workspace,
            refetchOnReconnect: true,
            refetchOnMount: true
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <KlarioSessionProvider>{children}</KlarioSessionProvider>
    </QueryClientProvider>
  );
}

export function useKlarioApi() {
  const value = useContext(KlarioApiContext);
  if (!value) {
    throw new Error("useKlarioApi must be used inside KlarioApiProvider");
  }
  return value;
}

function KlarioSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [roles, setRoles] = useState<FamilyRole[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingStatusResponse | null>(null);
  const [activeFamilyId, setActiveFamilyIdState] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<BackgroundUploadState | null>(null);
  const uploadSequence = useRef(0);

  const clearSessionState = useCallback(
    (nextMessage: string) => {
      clearKlarioSession();
      queryClient.clear();
      setStatus("signed-out");
      setUser(null);
      setFamilies([]);
      setMembers([]);
      setRoles([]);
      setOnboarding(null);
      setActiveFamilyIdState(null);
      setActiveMemberIdState(null);
      setLastSyncAt(null);
      setMessage(nextMessage);
      setUploadState(null);
    },
    [queryClient]
  );

  const loadFamilyContext = useCallback(
    async (familyId: string | null, currentUser: User | null) => {
      if (!familyId) {
        setMembers([]);
        setRoles([]);
        setActiveFamilyIdState(null);
        setActiveMemberIdState(null);
        setStoredActiveFamilyId(null);
        setStoredActiveMemberId(null);
        return;
      }

      const [memberResult, roleResult] = await Promise.allSettled([
        queryClient.fetchQuery({
          queryKey: protectedQueryKey(currentUser?.id, "members", familyId),
          queryFn: () => membersApi.list(familyId),
          ...queryFreshness.workspace
        }),
        queryClient.fetchQuery({
          queryKey: protectedQueryKey(currentUser?.id, "roles", familyId),
          queryFn: () => rolesApi.list(familyId),
          ...queryFreshness.account
        })
      ]);

      const nextMembers = memberResult.status === "fulfilled" ? memberResult.value : [];
      const nextRoles = roleResult.status === "fulfilled" ? roleResult.value : [];
      const storedMemberId = getStoredActiveMemberId();
      const selfMember = nextMembers.find((member) => member.relationship === "self");
      const nextMemberId = nextMembers.some((member) => member.id === storedMemberId)
        ? storedMemberId
        : selfMember?.id ?? nextMembers[0]?.id ?? null;

      setMembers(nextMembers);
      setRoles(nextRoles);
      setActiveFamilyIdState(familyId);
      setActiveMemberIdState(nextMemberId);
      setStoredActiveFamilyId(familyId);
      setStoredActiveMemberId(nextMemberId);

      if (currentUser && nextRoles.length === 0) {
        setMessage("Family roles are not available yet. Actions still depend on backend permission checks.");
      }
    },
    [queryClient]
  );

  const loadWorkspace = useCallback(
    async (currentUser: User, familySelection: "stored" | "original" = "stored") => {
      const onboardingStatus = await queryClient.fetchQuery({
        queryKey: protectedQueryKey(currentUser.id, "onboarding"),
        queryFn: onboardingApi.status,
        ...queryFreshness.account
      });

      setOnboarding(onboardingStatus);
      setUser(currentUser);

      if (!onboardingStatus.onboarding_completed) {
        setFamilies([]);
        setMembers([]);
        setRoles([]);
        setActiveFamilyIdState(null);
        setActiveMemberIdState(null);
        setStoredActiveFamilyId(null);
        setStoredActiveMemberId(null);
        setStatus("onboarding");
        setMessage("Complete onboarding to connect this workspace.");
        return;
      }

      const nextFamilies = await queryClient.fetchQuery({
        queryKey: protectedQueryKey(currentUser.id, "families"),
        queryFn: familiesApi.list,
        ...queryFreshness.account
      });
      const storedFamilyId = getStoredActiveFamilyId();
      const originalOwnedFamily = nextFamilies
        .filter((family) => family.owner_user_id === currentUser.id)
        .sort((first, second) => first.created_at.localeCompare(second.created_at))[0];
      const nextFamilyId = familySelection === "original"
        ? originalOwnedFamily?.id ?? nextFamilies[0]?.id ?? null
        : nextFamilies.some((family) => family.id === storedFamilyId) ? storedFamilyId : nextFamilies[0]?.id ?? null;

      setFamilies(nextFamilies);
      await loadFamilyContext(nextFamilyId, currentUser);
      setLastSyncAt(new Date().toISOString());
      setStatus("live");
      setMessage(null);
    },
    [loadFamilyContext, queryClient]
  );

  const restore = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setStatus("signed-out");
      setMessage("Sign in to connect this workspace to your Klario backend.");
      return;
    }

    try {
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["klario", "auth", "me"],
        queryFn: authApi.authMe,
        staleTime: 0
      });
      await loadWorkspace(currentUser);
    } catch (restoreError) {
      if (restoreError instanceof ApiError && restoreError.status === 401) {
        clearSessionState(SESSION_EXPIRED_MESSAGE);
        return;
      }
      setStatus("offline");
      setMessage("Could not reach the API. Check that the backend is running.");
    }
  }, [clearSessionState, loadWorkspace, queryClient]);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    const expireSession = () => clearSessionState(SESSION_EXPIRED_MESSAGE);
    window.addEventListener("klario:session-expired", expireSession);
    return () => window.removeEventListener("klario:session-expired", expireSession);
  }, [clearSessionState]);

  const login = useCallback(async (credentials: LoginRequest) => {
    return authApi.login(credentials);
  }, []);

  const completeOtpLogin = useCallback(
    async (request: OtpVerifyRequest) => {
      const tokenResponse = await authApi.verifyOtp(request);
      // A new identity must start with no observable responses from a prior identity.
      queryClient.clear();
      setStoredActiveFamilyId(null);
      setStoredActiveMemberId(null);
      setAuthTokens(tokenResponse.access_token, tokenResponse.refresh_token);
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["klario", "auth", "me"],
        queryFn: authApi.authMe,
        staleTime: 0
      });
      await loadWorkspace(currentUser, "original");
      return currentUser;
    },
    [loadWorkspace, queryClient]
  );

  const register = useCallback(async (request: RegisterRequest) => {
    return authApi.register(request);
  }, []);

  const logout = useCallback(() => {
    clearSessionState("Signed out.");
  }, [clearSessionState]);

  const backendLogout = useCallback(async () => {
    try {
      // The credential travels in the HttpOnly cookie; there is nothing to pass. This still
      // revokes the session server-side, so a captured credential is dead either way.
      await authApi.logout();
    } catch {
      // Local sign-out should still succeed if the server credential already expired.
    }
    clearSessionState("Signed out.");
  }, [clearSessionState]);

  const setActiveFamilyId = useCallback(
    async (familyId: string | null) => {
      await loadFamilyContext(familyId, user);
      setLastSyncAt(new Date().toISOString());
    },
    [loadFamilyContext, user]
  );

  const setActiveMemberId = useCallback((memberId: string | null) => {
    setActiveMemberIdState(memberId);
    setStoredActiveMemberId(memberId);
    setLastSyncAt(new Date().toISOString());
  }, []);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      // With no access token there is nothing to revalidate; apiFetch performs the
      // cookie-backed refresh on its own when a request comes back 401.
      logout();
      return;
    }

    try {
      await queryClient.invalidateQueries();
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["klario", "auth", "me"],
        queryFn: authApi.authMe,
        staleTime: 0
      });
      await loadWorkspace(currentUser);
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        clearSessionState(SESSION_EXPIRED_MESSAGE);
        return;
      }
      throw refreshError;
    }
  }, [clearSessionState, loadWorkspace, logout, queryClient]);

  const refreshOnboarding = useCallback(async () => {
    if (!user) return null;
    // staleTime must be 0 here. This runs immediately after a step is saved, and the whole
    // point is to learn what the server now says - `fetchQuery` honours staleTime and would
    // hand back the pre-save cache for the next five minutes, leaving `profile_completed`
    // false and the finish button disabled with the work already persisted.
    const onboardingStatus = await queryClient.fetchQuery({
      queryKey: protectedQueryKey(user.id, "onboarding"),
      queryFn: onboardingApi.status,
      ...queryFreshness.account,
      staleTime: 0
    });
    setOnboarding(onboardingStatus);
    if (onboardingStatus.onboarding_completed) {
      await loadWorkspace(user);
    } else {
      setStatus("onboarding");
    }
    return onboardingStatus;
  }, [loadWorkspace, queryClient, user]);

  const createFamily = useCallback(
    async (request: FamilyCreateRequest) => {
      const family = await familiesApi.create(request);
      await queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "families") });
      const nextFamilies = await queryClient.fetchQuery({
        queryKey: protectedQueryKey(user?.id, "families"),
        queryFn: familiesApi.list,
        ...queryFreshness.account
      });
      setFamilies(nextFamilies);
      await setActiveFamilyId(family.id);
      return family;
    },
    [queryClient, setActiveFamilyId, user?.id]
  );

  const createMember = useCallback(
    async (familyId: string, request: MemberCreateRequest) => {
      const member = await membersApi.create(familyId, request);
      await queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "members") });
      await loadFamilyContext(familyId, user);
      setActiveMemberId(member.id);
      return member;
    },
    [loadFamilyContext, queryClient, setActiveMemberId, user]
  );

  const invalidateWorkspaceData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "reports"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "dashboard"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "trends"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "metrics"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "attention"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "invites"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "profiles"), refetchType: "all" }),
      // Settings reads the signed-in person's own details under "account", and the self
      // profile under "members". Onboarding writes both, so leaving them out meant a name
      // saved during setup did not appear in Settings until their staleTime elapsed.
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "account"), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: protectedQueryPrefix(user?.id, "members"), refetchType: "all" })
    ]);
    setLastSyncAt(new Date().toISOString());
  }, [queryClient, user?.id]);

  const forgetDeletedDocument = useCallback(async (documentId: string) => {
    // A deleted document must never remain visible from an in-memory detail cache.
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return key[0] === "klario" && key[1] === "protected" && key[2] === (user?.id ?? "unauthenticated")
          && (key[3] === "documents" || key[3] === "reports")
          && key.includes(documentId);
      }
    });
    await invalidateWorkspaceData();
  }, [invalidateWorkspaceData, queryClient, user?.id]);

  const dismissUploadStatus = useCallback(() => setUploadState(null), []);

  const startReportUpload = useCallback(
    (request: BackgroundUploadRequest) => {
      const uploadId = ++uploadSequence.current;
      setUploadState({
        id: uploadId,
        phase: "validating",
        message: "Preparing your report",
        tone: "progress"
      });

      void (async () => {
        try {
          const document = await uploadAndParseReport({
            ...request,
            onStatus: (update) => {
              setUploadState((current) => current?.id === uploadId ? {
                id: uploadId,
                phase: update.phase,
                message: update.message,
                tone: "progress",
                documentId: update.document?.id
              } : current);
            }
          });
          await invalidateWorkspaceData();
          setUploadState((current) => current?.id === uploadId ? {
            id: uploadId,
            phase: "complete",
            message: "Report ready",
            tone: "success",
            documentId: document.id
          } : current);
        } catch (error) {
          setUploadState((current) => current?.id === uploadId ? {
            id: uploadId,
            phase: "failed",
            message: error instanceof Error ? error.message : "Your report could not be processed.",
            tone: "error"
          } : current);
        }
      })();
    },
    [invalidateWorkspaceData]
  );

  const activeFamily = useMemo(
    () => families.find((family) => family.id === activeFamilyId) ?? null,
    [activeFamilyId, families]
  );

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeMemberId) ?? null,
    [activeMemberId, members]
  );

  const currentRole = useMemo(
    () => roles.find((role) => role.user_id === user?.id)?.role ?? null,
    [roles, user?.id]
  );

  const value = useMemo<KlarioApiContextValue>(
    () => ({
      status,
      user,
      families,
      members,
      roles,
      activeFamily,
      activeMember,
      currentRole,
      onboarding,
      environment: getEnvironmentLabel(),
      lastSyncAt,
      message,
      isSignedIn: Boolean(user),
      setActiveFamilyId,
      setActiveMemberId,
      login,
      completeOtpLogin,
      register,
      logout,
      backendLogout,
      refresh,
      refreshOnboarding,
      createFamily,
      createMember,
      invalidateWorkspaceData,
      forgetDeletedDocument,
      uploadState,
      startReportUpload,
      dismissUploadStatus
    }),
    [
      activeFamily,
      activeMember,
      createFamily,
      createMember,
      currentRole,
      dismissUploadStatus,
      families,
      forgetDeletedDocument,
      backendLogout,
      invalidateWorkspaceData,
      lastSyncAt,
      login,
      completeOtpLogin,
      logout,
      members,
      message,
      onboarding,
      refresh,
      refreshOnboarding,
      register,
      roles,
      setActiveFamilyId,
      setActiveMemberId,
      status,
      startReportUpload,
      uploadState,
      user
    ]
  );

  return (
    <KlarioApiContext.Provider value={value}>
      {children}
      <BackgroundUploadBanner state={uploadState} onDismiss={dismissUploadStatus} />
    </KlarioApiContext.Provider>
  );
}

function BackgroundUploadBanner({ state, onDismiss }: { state: BackgroundUploadState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (state?.tone !== "success") return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss, state?.id, state?.tone]);

  if (!state) return null;

  const isWorking = state.tone === "progress";
  return (
    <aside className={`background-upload-banner is-${state.tone}`} aria-live="polite" aria-atomic="true">
      <BioIcon name={isWorking ? "icon_action_loading" : state.tone === "error" ? "icon_action_reject" : "icon_action_confirm_safe"} size={19} />
      <div>
        <strong>{isWorking ? "Adding report" : state.tone === "success" ? "Report added" : "Report needs attention"}</strong>
        <p>{state.message}{isWorking ? " — you can keep browsing." : ""}</p>
      </div>
      {state.documentId && state.tone === "success" ? <a className="button button-ghost" href={`/app/reports/${state.documentId}`}>View report</a> : null}
      {!isWorking ? <button className="button button-ghost icon-button" type="button" onClick={onDismiss} aria-label="Dismiss upload status"><BioIcon name="icon_action_reject" size={16} /></button> : null}
    </aside>
  );
}
