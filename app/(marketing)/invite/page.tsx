import type { Metadata } from "next";
import { InviteActions } from "@/components/invite-actions";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Family Invite",
  description: "Accept or reject a Klario family invite."
};

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Invite</p>
          <h1>Join a Klario family workspace.</h1>
          <p className="hero-lead">
            Accept an invite only while signed in as the email address that received it. Expired, revoked, or already-used invites are rejected by the backend.
          </p>
        </div>
        <InviteActions token={token} />
      </section>

      <section className="section">
        <SectionHeader
          label="Privacy"
          title="Invite links stay ephemeral"
          intro="Klario reads the token from this URL only for the accept or reject request. It is not written to session storage or local storage."
        />
      </section>
    </main>
  );
}
