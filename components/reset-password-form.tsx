"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { authApi } from "@/lib/api/klario-api";

const INVALID_RESET_LINK = "This reset link is invalid or has expired.";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const { logout } = useKlarioApi();
  const [resetToken, setResetToken] = useState(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(token ? "" : INVALID_RESET_LINK);

  const removeTokenFromUrl = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/reset-password");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!resetToken) {
      setError(INVALID_RESET_LINK);
      return;
    }
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: resetToken, new_password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      logout();
      router.replace("/login?reset=success");
    } catch {
      setError(INVALID_RESET_LINK);
    } finally {
      setResetToken(undefined);
      removeTokenFromUrl();
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-panel form-grid" onSubmit={submit}>
      {error ? <p className="form-alert">{error}</p> : null}
      <div>
        <label htmlFor="new_password">New password</label>
        <input id="new_password" name="new_password" type="password" autoComplete="new-password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} disabled={!resetToken || isSubmitting} required />
      </div>
      <div>
        <label htmlFor="confirm_password">Confirm password</label>
        <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} disabled={!resetToken || isSubmitting} required />
      </div>
      <button type="submit" disabled={!resetToken || isSubmitting}>{isSubmitting ? "Resetting password" : "Reset password"}</button>
      <p className="note">Need a new link? <Link href="/forgot-password">Request another reset email</Link>.</p>
    </form>
  );
}
