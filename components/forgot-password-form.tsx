"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useKlarioApi } from "@/components/klario-api-provider";
import { PasswordRequirements } from "@/components/password-requirements";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";
import { isAcceptablePassword, isValidEmail, maskEmail } from "@/lib/password-policy";

const GENERIC_SUCCESS = "If an account exists, a password reset code has been sent.";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devHint, setDevHint] = useState("");

  const sendCode = async () => {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    setDevHint("");
    setCode("");

    try {
      const response = await authApi.requestPasswordResetOtp({ email });
      setIsCodeRequested(true);
      setMessage(response.message || GENERIC_SUCCESS);
      if (response.otp_code) {
        setDevHint(`Development code: ${response.otp_code}`);
        setCode(response.otp_code);
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not send a reset code. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendCode();
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
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
      const verifyResponse = await authApi.verifyPasswordResetOtp({
        email,
        code: code.trim()
      });

      if (!verifyResponse.reset_token) {
        setError("Could not verify the reset code. Request a new code and try again.");
        return;
      }

      await authApi.resetForgotPassword({
        token: verifyResponse.reset_token,
        new_password: newPassword
      });

      router.replace("/login?reset=success");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not reset your password. Check the code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCodeRequested) {
    return (
      <form className="form-panel form-grid" onSubmit={resetPassword}>
        <h2>Enter your code</h2>
        {message ? <p className="note">{message}</p> : null}
        {devHint ? <p className="form-alert">{devHint}</p> : null}
        <div>
          <label htmlFor="reset_email">Email</label>
          <input
            id="reset_email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div>
          <label htmlFor="reset_code">Verification code</label>
          <input
            id="reset_code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={isSubmitting}
            required
          />
        </div>
        <div>
          <label htmlFor="new_password">New password</label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            disabled={isSubmitting}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm_password">Confirm password</label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            disabled={isSubmitting}
            required
          />
        </div>
        {error ? <p className="form-alert">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Resetting password" : "Set new password"}
        </button>
        <button type="button" className="button button-secondary" disabled={isSubmitting} onClick={() => void sendCode()}>
          Send a new code
        </button>
        <p className="note">
          Remembered your password? <Link href="/login">Sign in</Link>.
        </p>
      </form>
    );
  }

  return (
    <form className="form-panel form-grid" onSubmit={requestCode}>
      <div>
        <label htmlFor="forgot_email">Email</label>
        <input
          id="forgot_email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending code" : "Send reset code"}
      </button>
      <p className="note">
        Remembered your password? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
