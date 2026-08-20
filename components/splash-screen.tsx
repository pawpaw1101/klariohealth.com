"use client";

import { useEffect, useState } from "react";

export function SplashScreen({
  reducedMotion,
  onDone
}: {
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showFor = reducedMotion ? 400 : 1650;
    const fadeTimer = window.setTimeout(() => setIsLeaving(true), showFor);
    const doneTimer = window.setTimeout(onDone, showFor + 260);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone, reducedMotion]);

  return (
    <div className={`splash-overlay${isLeaving ? " is-leaving" : ""}`} role="status" aria-label="Loading Klario">
      {reducedMotion ? (
        <img
          alt="Klario"
          className="splash-logo-image"
          height={67}
          src="/brand/klario-logo-light.png"
          srcSet="/brand/klario-logo-light.png 1x, /brand/klario-logo-light@2x.png 2x, /brand/klario-logo-light@3x.png 3x"
          width={137}
        />
      ) : (
        <video
          aria-hidden="true"
          autoPlay
          className="splash-video"
          muted
          playsInline
          preload="auto"
          src="/brand/klario_splash_light_9x16.mp4"
        />
      )}
    </div>
  );
}
