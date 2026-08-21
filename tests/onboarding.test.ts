import { readFileSync } from "node:fs";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

const provider = readFileSync("components/klario-api-provider.tsx", "utf8");
const onboarding = readFileSync("components/workspaces/onboarding.tsx", "utf8");

/**
 * ONBOARD-001 / 002 — the bug that stranded a real user.
 *
 * Profile save returned 200 and persisted, but `refreshOnboarding()` read the status through
 * `fetchQuery` with a five-minute staleTime. fetchQuery honours staleTime, so it answered from
 * the pre-save cache without a request: `profile_completed` stayed false and the continue
 * button never enabled.
 */
describe("ONBOARD-001/002 post-mutation onboarding status", () => {
  it("demonstrates the mechanism: fetchQuery with a staleTime serves cache instead of refetching", async () => {
    const client = new QueryClient();
    let calls = 0;
    const queryFn = async () => ({ profile_completed: calls++ > 0 });
    const key = ["onboarding-status"];

    await client.fetchQuery({ queryKey: key, queryFn, staleTime: 5 * 60_000 });
    const cached = await client.fetchQuery({ queryKey: key, queryFn, staleTime: 5 * 60_000 });
    expect(calls).toBe(1);
    expect(cached.profile_completed).toBe(false); // stale: the save is invisible

    const fresh = await client.fetchQuery({ queryKey: key, queryFn, staleTime: 0 });
    expect(calls).toBe(2);
    expect(fresh.profile_completed).toBe(true); // the server's actual answer
  });

  it("refreshOnboarding fetches with staleTime 0", () => {
    const block = provider.slice(provider.indexOf("const refreshOnboarding"));
    const call = block.slice(0, block.indexOf("});") + 3);
    expect(call).toContain('protectedQueryKey(user.id, "onboarding")');
    expect(call).toMatch(/staleTime:\s*0/);
    // The spread must come first, or queryFreshness.account would overwrite staleTime again.
    expect(call.indexOf("...queryFreshness.account")).toBeLessThan(call.indexOf("staleTime: 0"));
  });
});

/** ONBOARD-004/005 — one user action must produce one mutation. */
describe("ONBOARD-004/005 double-submit protection", () => {
  it("guards every onboarding mutation handler with a synchronous ref", () => {
    for (const handler of ["saveProfile", "createFamily", "addDependent", "complete"]) {
      const start = onboarding.indexOf(`const ${handler} = async`);
      expect(start, `${handler} should exist`).toBeGreaterThan(-1);
      const body = onboarding.slice(start, start + 400);
      expect(body, `${handler} must bail out when already running`).toContain("if (inFlight.current) return;");
      expect(body, `${handler} must claim the guard`).toContain("inFlight.current = true;");
    }
    // Released exactly once per handler, in finally.
    expect(onboarding.match(/inFlight\.current = false;/g)?.length).toBe(4);
  });

  it("uses a ref rather than state, which cannot be outrun by a re-render", () => {
    expect(onboarding).toContain("const inFlight = useRef(false)");
  });
});

/** ONBOARD-007 — what was saved must be visible where it is displayed. */
describe("ONBOARD-007 cache invalidation", () => {
  it("invalidates the caches that render the saved profile", () => {
    const block = provider.slice(provider.indexOf("const invalidateWorkspaceData"));
    const body = block.slice(0, block.indexOf("]);"));
    for (const resource of ["account", "members", "profiles", "dashboard"]) {
      expect(body, `${resource} must be invalidated`).toContain(`"${resource}"`);
    }
  });

  it("saving the profile refreshes status and workspace caches", () => {
    const start = onboarding.indexOf("const saveProfile = async");
    const body = onboarding.slice(start, onboarding.indexOf("const createFamily"));
    expect(body).toContain("api.refreshOnboarding()");
    expect(body).toContain("api.invalidateWorkspaceData()");
  });
});

/** ONBOARD-009 — a returning user resumes at the step the server says they are on. */
describe("ONBOARD-009 resume from server state", () => {
  it("derives the active step from the backend status, not local state", () => {
    expect(onboarding).toContain("!onboarding?.profile_completed");
    expect(onboarding).toContain("!onboarding?.family_setup_completed");
  });

  it("never allows a future date of birth", () => {
    expect(onboarding).toContain('max={new Date().toISOString().slice(0, 10)}');
  });

  it("preserves entered data when a save fails", () => {
    const start = onboarding.indexOf("const saveProfile = async");
    const body = onboarding.slice(start, onboarding.indexOf("const createFamily"));
    // The catch only sets a message; it must not reset the form state.
    const catchBlock = body.slice(body.indexOf("catch"));
    expect(catchBlock).not.toContain("setProfile(");
  });
});
