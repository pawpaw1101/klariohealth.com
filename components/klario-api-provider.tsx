"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  clearKlarioSession,
  getAuthToken,
  getEnvironmentLabel,
  getStoredActiveFamilyId,
  getStoredActiveMemberId,
  setAuthToken,
  setStoredActiveFamilyId,
  setStoredActiveMemberId
} from "@/lib/api/client";
import { authApi, familiesApi, membersApi, rolesApi } from "@/lib/api/klario-api";
import type {
  Family,
  FamilyCreateRequest,
  FamilyMember,
  FamilyRole,
  FamilyRoleType,
  LoginRequest,
  MemberCreateRequest,
  RegisterRequest,
  User
} from "@/lib/api/types";

type ApiStatus = "checking" | "signed-out" | "live" | "offline";

type KlarioApiContextValue = {
  status: ApiStatus;
  user: User | null;
  families: Family[];
  members: FamilyMember[];
  roles: FamilyRole[];
  activeFamily: Family | null;
  activeMember: FamilyMember | null;
  currentRole: FamilyRoleType | null;
  environment: string;
  lastSyncAt: string | null;
  message: string | null;
  isSignedIn: boolean;
  setActiveFamilyId: (familyId: string | null) => Promise<void>;
  setActiveMemberId: (memberId: string | null) => void;
  login: (credentials: LoginRequest) => Promise<User>;
  registerAndLogin: (request: RegisterRequest) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  createFamily: (request: FamilyCreateRequest) => Promise<Family>;
  createMember: (familyId: string, request: MemberCreateRequest) => Promise<FamilyMember>;
  invalidateWorkspaceData: () => Promise<void>;
};

const KlarioApiContext = createContext<KlarioApiContextValue | null>(null);

export function KlarioApiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30000
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
  const [activeFamilyId, setActiveFamilyIdState] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
          queryKey: ["members", "list", familyId],
          queryFn: () => membersApi.list(familyId)
        }),
        queryClient.fetchQuery({
          queryKey: ["roles", "list", familyId],
          queryFn: () => rolesApi.list(familyId)
        })
      ]);

      const nextMembers = memberResult.status === "fulfilled" ? memberResult.value : [];
      const nextRoles = roleResult.status === "fulfilled" ? roleResult.value : [];
      const storedMemberId = getStoredActiveMemberId();
      const nextMemberId = nextMembers.some((member) => member.id === storedMemberId) ? storedMemberId : nextMembers[0]?.id ?? null;

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
    async (currentUser: User) => {
      const nextFamilies = await queryClient.fetchQuery({
        queryKey: ["families", "list"],
        queryFn: familiesApi.list
      });
      const storedFamilyId = getStoredActiveFamilyId();
      const nextFamilyId = nextFamilies.some((family) => family.id === storedFamilyId) ? storedFamilyId : nextFamilies[0]?.id ?? null;

      setUser(currentUser);
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
        queryKey: ["auth", "me"],
        queryFn: authApi.me,
        staleTime: 0
      });
      await loadWorkspace(currentUser);
    } catch {
      setStatus("offline");
      setMessage("Klario API is not reachable. Showing local demo data until the backend is available.");
    }
  }, [loadWorkspace, queryClient]);

  useEffect(() => {
    void restore();
  }, [restore]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const tokenResponse = await authApi.login(credentials);
      setAuthToken(tokenResponse.access_token);
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["auth", "me"],
        queryFn: authApi.me,
        staleTime: 0
      });
      await loadWorkspace(currentUser);
      return currentUser;
    },
    [loadWorkspace, queryClient]
  );

  const registerAndLogin = useCallback(
    async (request: RegisterRequest) => {
      await authApi.register(request);
      return login({ email: request.email, password: request.password });
    },
    [login]
  );

  const logout = useCallback(() => {
    clearKlarioSession();
    queryClient.clear();
    setStatus("signed-out");
    setUser(null);
    setFamilies([]);
    setMembers([]);
    setRoles([]);
    setActiveFamilyIdState(null);
    setActiveMemberIdState(null);
    setLastSyncAt(null);
    setMessage("Signed out.");
  }, [queryClient]);

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
      logout();
      return;
    }

    await queryClient.invalidateQueries();
    const currentUser = await queryClient.fetchQuery({
      queryKey: ["auth", "me"],
      queryFn: authApi.me,
      staleTime: 0
    });
    await loadWorkspace(currentUser);
  }, [loadWorkspace, logout, queryClient]);

  const createFamily = useCallback(
    async (request: FamilyCreateRequest) => {
      const family = await familiesApi.create(request);
      await queryClient.invalidateQueries({ queryKey: ["families"] });
      const nextFamilies = await familiesApi.list();
      setFamilies(nextFamilies);
      await setActiveFamilyId(family.id);
      return family;
    },
    [queryClient, setActiveFamilyId]
  );

  const createMember = useCallback(
    async (familyId: string, request: MemberCreateRequest) => {
      const member = await membersApi.create(familyId, request);
      await queryClient.invalidateQueries({ queryKey: ["members", "list", familyId] });
      await loadFamilyContext(familyId, user);
      setActiveMemberId(member.id);
      return member;
    },
    [loadFamilyContext, queryClient, setActiveMemberId, user]
  );

  const invalidateWorkspaceData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["documents"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["trends"] }),
      queryClient.invalidateQueries({ queryKey: ["attention"] }),
      queryClient.invalidateQueries({ queryKey: ["invites"] })
    ]);
    setLastSyncAt(new Date().toISOString());
  }, [queryClient]);

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
      environment: getEnvironmentLabel(),
      lastSyncAt,
      message,
      isSignedIn: Boolean(user),
      setActiveFamilyId,
      setActiveMemberId,
      login,
      registerAndLogin,
      logout,
      refresh,
      createFamily,
      createMember,
      invalidateWorkspaceData
    }),
    [
      activeFamily,
      activeMember,
      createFamily,
      createMember,
      currentRole,
      families,
      invalidateWorkspaceData,
      lastSyncAt,
      login,
      logout,
      members,
      message,
      refresh,
      registerAndLogin,
      roles,
      setActiveFamilyId,
      setActiveMemberId,
      status,
      user
    ]
  );

  return <KlarioApiContext.Provider value={value}>{children}</KlarioApiContext.Provider>;
}
