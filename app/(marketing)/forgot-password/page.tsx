import type { Metadata } from "next";
import Link from "next/link";
import { BioIcon } from "@/components/bio-icon";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SectionHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a Klario password reset verification code."
};

export default function ForgotPasswordPage() {
  return (
    <main className="content auth-page">
      <section className="hero">
        <div className="hero-copy">

          <h1>Reset your Klario password.</h1>
          <p className="hero-lead">
            Enter your email and Klario will send a verification code if the account is eligible.
          </p>
          <div className="login-benefits">
            {[
              "Generic response protects account privacy",
              "Verification codes expire automatically",
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


    </main>
  );
}
