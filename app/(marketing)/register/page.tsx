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
    <main className="content auth-page">
      <section className="hero">
        <div className="hero-copy">

          <h1>Start your private health workspace.</h1>
          <p className="hero-lead">
            Choose a password, then verify your email with a one-time code to activate your account.
          </p>
          <div className="login-benefits">
            {["Password plus email verification", "Family and member selection after login", "Upload flow ready for OCR and medical parsing"].map((benefit) => (
              <div className="login-benefit" key={benefit}>
                <span className="login-benefit-icon" aria-hidden="true"><BioIcon name="icon_action_confirm_safe" size={16} /></span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
        <RegisterForm />
      </section>


    </main>
  );
}
