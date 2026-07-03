import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new Klario password from a reset link."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Password reset</p>
          <h1>Choose a new password.</h1>
          <p className="hero-lead">
            Use the reset link from your email. Expired or already-used links are rejected safely.
          </p>
          <div className="login-benefits">
            {[
              "The link is single-use",
              "Passwords are updated through the secure API",
              "The token is not stored by the browser"
            ].map((benefit) => (
              <div className="login-benefit" key={benefit}>
                <span className="login-benefit-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={16} /></span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
        <ResetPasswordForm token={token} />
      </section>

      <section className="section">
        <SectionHeader
          label="Need help"
          title="Request a fresh link"
          intro="Password reset links expire quickly. Request another email if this one no longer works."
        />
        <div className="button-row">
          <Link className="button button-secondary" href="/forgot-password">Request reset email</Link>
        </div>
      </section>
    </main>
  );
}
