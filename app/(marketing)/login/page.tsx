import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { LoginForm } from "@/components/login-form";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Try for Free",
  description: "Sign in to Klario and start tracking medical reports, biomarker trends, and family health records."
};

const benefits = [
  "Upload lab reports from photo, PDF, or email",
  "Track biomarker trends across every test",
  "Manage health records for your whole family"
];

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ reset?: string | string[]; session?: string | string[] }>;
}) {
  const params = await searchParams;
  const reset = Array.isArray(params.reset) ? params.reset[0] : params.reset;
  const session = Array.isArray(params.session) ? params.session[0] : params.session;
  const notice =
    reset === "success"
      ? "Password has been reset successfully. Sign in with your new password."
      : session === "expired"
        ? "Your session expired. Please sign in again."
        : undefined;

  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Try for free</p>
          <h1>Sign in to Klario.</h1>
          <p className="hero-lead">
            Sign in with your password, then confirm with a one-time code sent to your email.
          </p>
          <div className="login-benefits">
            {benefits.map((benefit) => (
              <div className="login-benefit" key={benefit}>
                <span className="login-benefit-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={16} /></span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
        <LoginForm notice={notice} />
      </section>

      <section className="section">
        <SectionHeader
          label="New here"
          title="Create an account"
          intro="Register with your name, email, and password. We will send a verification code to activate your account."
        />
        <div className="button-row">
          <Link className="button button-secondary" href="/register">Create account</Link>
        </div>
      </section>
    </main>
  );
}
