"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PasswordRequirements } from "@/components/password-requirements";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";
import { isAcceptablePassword, isValidEmail, maskEmail } from "@/lib/password-policy";

type Step = "email" | "code" | "password" | "success";

export function ForgotPasswordForm() {
  const { logout } = useKlarioApi();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!isValidEmail(normalizedEmail)) return setError("Enter a valid email address.");
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.requestForgotPasswordCode({ email: normalizedEmail });
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not send a verification code. Try again.");
    } finally { setIsSubmitting(false); }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== 6) return setError("Enter the 6-digit code.");
    setIsSubmitting(true);
    setError("");
    try {
      const response = await authApi.verifyForgotPasswordCode({ email: normalizedEmail, code });
      if (!response.reset_token) throw new Error("No reset authorization returned.");
      setResetToken(response.reset_token);
      setStep("password");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "That code is invalid or expired. Request a new code.");
    } finally { setIsSubmitting(false); }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAcceptablePassword(password)) return setError("Your password doesn't meet the requirements.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.resetForgotPassword({ token: resetToken, new_password: password });
      logout();
      setPassword("");
      setConfirmation("");
      setResetToken("");
      setStep("success");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not reset your password. Try again.");
    } finally { setIsSubmitting(false); }
  };

  if (step === "success") return <div className="form-panel form-grid"><h2>Password updated</h2><p className="note">Your password has been changed successfully. You can now sign in with your new password.</p><Link className="button button-primary" href="/login">Back to sign in</Link></div>;
  if (step === "code") return <form className="form-panel form-grid" onSubmit={verifyCode}><h2>Check your email</h2><p className="note">If an account exists for <strong>{maskEmail(normalizedEmail)}</strong>, we&apos;ve sent a verification code.</p><div><label htmlFor="reset-code">Verification code</label><input id="reset-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" /></div>{error ? <p className="form-alert">{error}</p> : null}<button type="submit" disabled={isSubmitting || code.length !== 6}>{isSubmitting ? "Verifying" : "Verify code"}</button><button className="button button-ghost" type="button" disabled={isSubmitting} onClick={() => void requestCode()}>Resend code</button><button className="button button-ghost" type="button" onClick={() => { setStep("email"); setError(""); }}>Back</button></form>;
  if (step === "password") return <form className="form-panel form-grid" onSubmit={resetPassword}><h2>Create New Password</h2><p className="note">Choose a strong password for your Klario account.</p><div><label htmlFor="reset-new-password">New password</label><input id="reset-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} /></div><PasswordRequirements password={password} /><div><label htmlFor="reset-confirm-password">Confirm new password</label><input id="reset-confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} maxLength={128} />{confirmation && password !== confirmation ? <p className="form-alert">Passwords do not match.</p> : null}</div>{error ? <p className="form-alert">{error}</p> : null}<button type="submit" disabled={isSubmitting || !isAcceptablePassword(password) || password !== confirmation}>{isSubmitting ? "Updating" : "Reset Password"}</button></form>;

  return <form className="form-panel form-grid" onSubmit={requestCode}><h2>Forgot password?</h2><p className="note">Enter the email associated with your Klario account.</p><div><label htmlFor="forgot_email">Email address</label><input id="forgot_email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>{error ? <p className="form-alert">{error}</p> : null}<button type="submit" disabled={isSubmitting || !isValidEmail(normalizedEmail)}>{isSubmitting ? "Sending" : "Send verification code"}</button><p className="note"><Link href="/login">Back to sign in</Link></p></form>;
}
