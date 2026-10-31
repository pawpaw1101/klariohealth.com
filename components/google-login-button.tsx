"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: { id: {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: { theme: "outline"; size: "large"; shape: "rectangular"; text: "continue_with"; width: number }) => void;
    disableAutoSelect: () => void;
  } };
};

declare global {
  interface Window { google?: GoogleIdentity }
}

export function GoogleLoginButton({ onCredential, onError, busy = false }: {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
  busy?: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const mount = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const callback = useCallback((response: GoogleCredentialResponse) => {
    if (!response.credential) {
      onError("Google sign-in did not return a credential. Please try again.");
      return;
    }
    void onCredential(response.credential).catch(() => onError("Could not sign in with Google. Please try again."));
  }, [onCredential, onError]);

  useEffect(() => {
    if (!loaded || !clientId || !mount.current || !window.google) return;
    mount.current.replaceChildren();
    window.google.accounts.id.initialize({ client_id: clientId, callback });
    window.google.accounts.id.renderButton(mount.current, {
      theme: "outline", size: "large", shape: "rectangular", text: "continue_with", width: Math.min(360, mount.current.clientWidth || 360)
    });
  }, [callback, clientId, loaded]);

  if (!clientId) return null;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <div aria-busy={busy} className={busy ? "google-login-button is-busy" : "google-login-button"} ref={mount} style={{ pointerEvents: busy ? "none" : "auto", opacity: busy ? 0.65 : 1 }} />
    </>
  );
}
