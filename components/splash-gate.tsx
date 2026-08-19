"use client";

import { useCallback, useEffect, useState } from "react";
import { SplashScreen } from "@/components/splash-screen";

const SPLASH_KEY = "klario.splash.seen";

export function SplashGate() {
  const [state, setState] = useState<"checking" | "show" | "hidden">("checking");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    if (window.localStorage.getItem(SPLASH_KEY) === "1") {
      setState("hidden");
      return;
    }
    setState("show");
  }, []);

  const finish = useCallback(() => {
    window.localStorage.setItem(SPLASH_KEY, "1");
    setState("hidden");
  }, []);

  if (state !== "show") return null;
  return <SplashScreen reducedMotion={reducedMotion} onDone={finish} />;
}
