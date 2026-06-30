"use client";

import { useState } from "react";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { invitesApi } from "@/lib/api/klario-api";

export function InviteActions({ token }: { token?: string }) {
  const { refresh, isSignedIn } = useKlarioApi();
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState(token ? "Sign in first if this invite was sent to your email address." : "No invite token was found in this link.");
  const [error, setError] = useState("");

  const respond = async (action: "accept" | "reject") => {
    if (!token) return;
    setIsWorking(true);
    setError("");

    try {
      if (action === "accept") {
        await invitesApi.accept({ invite_token: token });
        await refresh();
        setMessage("Invite accepted. Your family workspace is ready.");
      } else {
        await invitesApi.reject({ invite_token: token });
        setMessage("Invite rejected.");
      }
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "This invite is no longer valid.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="form-panel form-grid invite-panel">
      <span className="feature-icon" aria-hidden="true"><BioIcon name="icon_family_header" size={24} /></span>
      <h2>Family invite</h2>
      <p>{message}</p>
      {error ? <p className="form-alert">{error}</p> : null}
      {!isSignedIn ? (
        <Link className="button button-primary" href="/login">
          Sign in
          <BioIcon name="icon_action_continue" size={17} />
        </Link>
      ) : null}
      <div className="button-row compact">
        <button className="button button-primary" type="button" disabled={!token || isWorking || !isSignedIn} onClick={() => respond("accept")}>
          <BioIcon name="icon_action_confirm_safe" size={17} />
          Accept
        </button>
        <button className="button button-secondary" type="button" disabled={!token || isWorking || !isSignedIn} onClick={() => respond("reject")}>
          <BioIcon name="icon_action_reject" size={17} />
          Reject
        </button>
      </div>
      <p className="note">Invite links are single-use and the token is not stored by the browser.</p>
    </div>
  );
}
