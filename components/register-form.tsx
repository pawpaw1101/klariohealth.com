"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";
import { PasswordRequirements } from "@/components/password-requirements";
import { isAcceptablePassword, isValidEmail } from "@/lib/password-policy";

export function RegisterForm() {
  const router = useRouter();
  const { completeOtpLogin } = useKlarioApi();
  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setDevHint("");
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (!isAcceptablePassword(password)) return setError("Your password doesn't meet the requirements.");
    if (password !== confirmation) return setError("Passwords do not match.");
    if (!acceptsTerms) return setError("Review and accept the Terms & Privacy Policy to continue.");
    setIsSubmitting(true);

    try {
      const response = await authApi.register({ email, password, full_name: fullName });
      if (response.otp_code) {
        setDevHint(`Development code: ${response.otp_code}`);
      }
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not create your account. Try again.");
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
      window.setTimeout(() => router.push("/app/family"), 420);
    } catch (verifyError) {
      setError(verifyError instanceof ApiError ? verifyError.message : "Invalid or expired code.");
      setIsSubmitting(false);
    }
  };

  if (step === "code") {
    return (
      <form className="form-grid" onSubmit={verifyCode}>
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
    <form className="form-grid" onSubmit={sendCode}>
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
        <div className="password-field">
          <input id="register_password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Choose a password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} required />
          <button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
      </div>
      <PasswordRequirements password={password} />
      <div>
        <label htmlFor="register_confirm_password">Confirm password</label>
        <div className="password-field">
          <input id="register_confirm_password" name="confirm_password" type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} maxLength={128} required aria-describedby={confirmation && password !== confirmation ? "register-password-mismatch" : undefined} />
          <button className="password-toggle" type="button" aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirmation((value) => !value)}>{showConfirmation ? "Hide" : "Show"}</button>
        </div>
        {confirmation && password !== confirmation ? <p className="form-alert" id="register-password-mismatch">Passwords do not match.</p> : null}
      </div>
      <label className="auth-terms">
        <input type="checkbox" checked={acceptsTerms} onChange={(event) => setAcceptsTerms(event.target.checked)} />
        <span>I agree to the Terms of Service and Privacy Policy</span>
      </label>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting || !fullName.trim() || !isValidEmail(email) || !isAcceptablePassword(password) || password !== confirmation || !acceptsTerms}>
        {isSubmitting ? "Creating account" : "Create account"}
      </button>
      <p className="note">
        Already have an account? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
