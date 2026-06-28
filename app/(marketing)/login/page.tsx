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

export default function LoginPage() {
  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Try for free</p>
          <h1>Enter the Klario web app.</h1>
          <p className="hero-lead">
            Create an account or sign in to upload reports, view biomarker charts, review extracted values, and manage family records all in one place.
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
        <LoginForm />
      </section>

      <section className="section">
        <SectionHeader
          label="Next steps"
          title="What happens next"
          intro="After login, you enter the web app where you can explore the full Klario experience: dashboard, documents, trends, timeline, and family profiles."
        />
        <div className="button-row">
          <Link className="button button-secondary" href="/app/dashboard">Open app</Link>
        </div>
      </section>
    </main>
  );
}
