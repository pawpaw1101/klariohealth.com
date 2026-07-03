"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";

export function RegisterForm() {
  const router = useRouter();
  const { completeOtpLogin } = useKlarioApi();
  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setDevHint("");

    try {
      const response = await authApi.register({ email, password, full_name: fullName });
      if (response.otp_code) {
        setDevHint(`Development code: ${response.otp_code}`);
      }
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setIsSubmitting(true);
    setError("");
    setDevHint("");

    try {
      const response = await authApi.requestOtp({ email, purpose: "register" });
      if (response.otp_code) {
        setDevHint(`Development code: ${response.otp_code}`);
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await completeOtpLogin({
        email,
        code,
        purpose: "register",
        full_name: fullName
      });
      window.dispatchEvent(new Event("klario:navigation-start"));
      window.setTimeout(() => router.push("/app/dashboard"), 420);
    } catch (verifyError) {
      setError(verifyError instanceof ApiError ? verifyError.message : "Invalid or expired code.");
      setIsSubmitting(false);
    }
  };

  if (step === "code") {
    return (
      <form className="form-panel form-grid" onSubmit={verifyCode}>
        <p className="note">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        {devHint ? <p className="note">{devHint}</p> : null}
        <div>
          <label htmlFor="register_otp_code">Verification code</label>
          <input
            id="register_otp_code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>
        {error ? <p className="form-alert">{error}</p> : null}
        <button type="submit" disabled={isSubmitting || code.length !== 6}>
          {isSubmitting ? "Creating account" : "Verify and create account"}
        </button>
        <button className="button button-ghost" type="button" disabled={isSubmitting} onClick={() => void resendCode()}>
          Resend code
        </button>
        <button className="button button-ghost" type="button" onClick={() => setStep("details")}>
          Back
        </button>
      </form>
    );
  }

  return (
    <form className="form-panel form-grid" onSubmit={sendCode}>
      <div>
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="register_email">Email</label>
        <input
          id="register_email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="register_password">Password</label>
        <input
          id="register_password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Choose a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account" : "Create account"}
      </button>
      <p className="note">
        Already have an account? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
