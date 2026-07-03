import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a Klario password reset link."
};

export default function ForgotPasswordPage() {
  return (
    <main className="content cascade-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Account recovery</p>
          <h1>Reset your Klario password.</h1>
          <p className="hero-lead">
            Enter your email and Klario will send a password reset link if the account is eligible.
          </p>
          <div className="login-benefits">
            {[
              "Generic response protects account privacy",
              "Reset links expire automatically",
              "Your health records stay out of email"
            ].map((benefit) => (
              <div className="login-benefit" key={benefit}>
                <span className="login-benefit-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={16} /></span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
        <ForgotPasswordForm />
      </section>

      <section className="section">
        <SectionHeader
          label="Back to login"
          title="Remembered your password?"
          intro="Sign in with your password, then confirm with the email verification code."
        />
        <div className="button-row">
          <Link className="button button-secondary" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
