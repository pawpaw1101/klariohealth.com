"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

export function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const api = useKlarioApi();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (api.status === "checking") return;
    if (!api.isSignedIn) {
      const params = new URLSearchParams({ next: pathname });
      if (api.message === SESSION_EXPIRED_MESSAGE) {
        params.set("session", "expired");
      }
      router.replace(`/login?${params.toString()}`);
      return;
    }
    if (api.status === "onboarding" && pathname !== "/app/onboarding") {
      router.replace("/app/onboarding");
      return;
    }
    if (api.status === "live" && pathname === "/app/onboarding") {
      router.replace("/app/dashboard");
    }
  }, [api.isSignedIn, api.message, api.status, pathname, router]);

  if (api.status === "checking") {
    return (
      <div className="app-shell app-cascade-shell">
        <p className="note">Checking your session…</p>
      </div>
    );
  }

  if (!api.isSignedIn) {
    return null;
  }

  if (api.status === "onboarding" && pathname !== "/app/onboarding") {
    return null;
  }

  return <>{children}</>;
}
