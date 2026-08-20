import type { QueryKey } from "@tanstack/react-query";

/**
 * Klario's authenticated cache is deliberately memory-only. Never add a persister here:
 * query payloads can contain protected health information.
 */
export const queryFreshness = {
  processing: {
    staleTime: 10_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true
  },
  workspace: {
    staleTime: 60_000,
    gcTime: 20 * 60_000,
    refetchOnWindowFocus: true
  },
  account: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true
  },
  catalog: {
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false
  }
} as const;

/**
 * Every protected response is partitioned by the authenticated user before its resource
 * identity. This makes a query-cache reuse across two sign-ins impossible even if a logout
 * were interrupted; logout still clears the entire in-memory cache as the primary safeguard.
 */
export function protectedQueryKey(userId: string | null | undefined, resource: string, ...parts: readonly unknown[]): QueryKey {
  return ["klario", "protected", userId ?? "unauthenticated", resource, ...parts];
}

export function protectedQueryPrefix(userId: string | null | undefined, resource?: string): QueryKey {
  return resource
    ? ["klario", "protected", userId ?? "unauthenticated", resource]
    : ["klario", "protected", userId ?? "unauthenticated"];
}
