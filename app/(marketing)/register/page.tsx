import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { RegisterForm } from "@/components/register-form";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Klario account to upload medical reports, choose family members, and track health trends."
};

export default function RegisterPage() {
  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Create account</p>
          <h1>Start your private health workspace.</h1>
          <p className="hero-lead">
            Klario keeps authentication, family selection, uploads, parsing, trends, attention items, and invites aligned with the backend API.
          </p>
          <div className="login-benefits">
            {["Secure sign in with bearer JWT", "Family and member selection after login", "Upload flow ready for OCR and medical parsing"].map((benefit) => (
              <div className="login-benefit" key={benefit}>
                <span className="login-benefit-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={16} /></span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
        <RegisterForm />
      </section>

      <section className="section">
        <SectionHeader
          label="Already set up"
          title="Return to your workspace"
          intro="If you already have an account or accepted a family invite, sign in with the email address attached to that account."
        />
        <div className="button-row">
          <Link className="button button-secondary" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
