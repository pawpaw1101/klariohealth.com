"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PasswordRequirements } from "@/components/password-requirements";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";
import { isAcceptablePassword } from "@/lib/password-policy";

type Stage = "form" | "invalid" | "success";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const { logout } = useKlarioApi();
  const [resetToken, setResetToken] = useState(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // A link that never carried a token is already spent as far as the user is concerned.
  const [stage, setStage] = useState<Stage>(token ? "form" : "invalid");

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = Boolean(resetToken) && isAcceptablePassword(newPassword) && newPassword === confirmPassword && !isSubmitting;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!resetToken) return setStage("invalid");
    if (!isAcceptablePassword(newPassword)) return setError("Your password doesn't meet the requirements.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: resetToken, new_password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      // The backend has revoked every session for this account; drop any local one too.
      logout();
      // The token is single-use and now spent — take it out of the address bar so a reload
      // or a shared URL cannot replay it.
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/reset-password");
      setResetToken(undefined);
      setStage("success");
    } catch (resetError) {
      if (resetError instanceof ApiError) {
        // The backend answers an expired, unknown or already-used token identically, on
        // purpose. Anything else is a transient problem worth letting the user retry.
        setResetToken(undefined);
        if (typeof window !== "undefined") window.history.replaceState(null, "", "/reset-password");
        setStage("invalid");
      } else {
        setError("We couldn't reach Klario. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === "success") {
    return (
      <div className="form-panel form-grid auth-outcome">
        <span className="auth-outcome-icon is-success" aria-hidden="true">✓</span>
        <h2>Password updated</h2>
        <p className="note">Your password has been changed successfully. For your security, you have been signed out on every device.</p>
        <button type="button" onClick={() => router.push("/login")}>Sign in</button>
      </div>
    );
  }

  if (stage === "invalid") {
    return (
      <div className="form-panel form-grid auth-outcome">
        <span className="auth-outcome-icon is-warning" aria-hidden="true">!</span>
        <h2>Reset link expired</h2>
        <p className="note">This password reset link is no longer valid. Reset links are single-use and expire quickly.</p>
        <Link className="button button-primary" href="/forgot-password">Request a new reset link</Link>
        <p className="note">
          Remembered your password? <Link href="/login">Sign in</Link>.
        </p>
      </div>
    );
  }

  return (
    <form className="form-panel form-grid" onSubmit={submit}>
      <div>
        <label htmlFor="new_password">New password</label>
        <div className="password-field">
          <input
            id="new_password"
            name="new_password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            maxLength={128}
            disabled={isSubmitting}
            required
          />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <PasswordRequirements password={newPassword} />
      <div>
        <label htmlFor="confirm_password">Confirm password</label>
        <div className="password-field">
          <input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmation ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            maxLength={128}
            disabled={isSubmitting}
            aria-describedby={mismatch ? "reset-password-mismatch" : undefined}
            required
          />
          <button type="button" className="password-toggle" onClick={() => setShowConfirmation((shown) => !shown)}>
            {showConfirmation ? "Hide" : "Show"}
          </button>
        </div>
        {mismatch ? <p className="field-error" id="reset-password-mismatch">Passwords do not match</p> : null}
      </div>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={!canSubmit}>
        {isSubmitting ? "Updating password" : "Update password"}
      </button>
      <p className="note">
        Need a new link? <Link href="/forgot-password">Request another reset email</Link>.
      </p>
    </form>
  );
}
