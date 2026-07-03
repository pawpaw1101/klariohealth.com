"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";

const GENERIC_SUCCESS = "If an account exists, password reset instructions have been sent.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await authApi.forgotPassword({ email });
      setEmail("");
      setIsSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not send reset instructions. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="form-panel form-grid">
        <h2>Check your email</h2>
        <p className="note">{GENERIC_SUCCESS}</p>
        <Link className="button button-primary" href="/login">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form className="form-panel form-grid" onSubmit={submit}>
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
        {isSubmitting ? "Sending instructions" : "Send reset instructions"}
      </button>
      <p className="note">
        Remembered your password? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
