"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { NavIcon } from "@/components/nav-icon";
import { authApi } from "@/lib/api/klario-api";
import { ApiError } from "@/lib/api/client";

/**
 * Only same-origin paths inside the signed-in app are accepted, so a crafted `next` cannot
 * bounce someone to another host after they authenticate.
 */
function safeDestination(next?: string) {
  if (!next || !next.startsWith("/app/")) return "/app/dashboard";
  // "//host" is protocol-relative and leaves the origin; ".." climbs back out of /app/.
  if (next.startsWith("//") || next.includes("..")) return "/app/dashboard";
  return next;
}

export function LoginForm({ notice, next }: { notice?: string; next?: string }) {
  const router = useRouter();
  const { completeOtpLogin } = useKlarioApi();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setDevHint("");

    try {
      const response = await authApi.login({ email, password });
      if (response.otp_code) {
        setDevHint(`Development code: ${response.otp_code}`);
      }
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setIsSubmitting(true);
    setError("");
    setDevHint("");

    try {
      const response = await authApi.requestOtp({ email, password, purpose: "login" });
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
      await completeOtpLogin({ email, code, purpose: "login" });
      window.dispatchEvent(new Event("klario:navigation-start"));
      window.setTimeout(() => router.push(safeDestination(next)), 420);
    } catch (verifyError) {
      setError(verifyError instanceof ApiError ? verifyError.message : "Invalid or expired code.");
      setIsSubmitting(false);
    }
  };

  if (step === "code") {
    return (
      <form className="form-grid" onSubmit={verifyCode}>
        <p className="note">We sent a 6-digit code to <strong>{email}</strong>.</p>
        {devHint ? <p className="note">{devHint}</p> : null}
        <div>
          <label htmlFor="otp_code">Sign-in code</label>
          <input
            id="otp_code"
            name="otp_code"
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
          {isSubmitting ? "Signing in" : "Verify and continue"}
        </button>
        <button className="button button-ghost" type="button" disabled={isSubmitting} onClick={() => void resendCode()}>
          Resend code
        </button>
        <button className="button button-ghost" type="button" onClick={() => setStep("credentials")}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form className="form-grid" onSubmit={sendCode}>
      {notice ? <p className="note">{notice}</p> : null}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
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
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            <NavIcon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>
      </div>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending code" : "Continue"}
      </button>
      <p className="note">
        New here? <Link href="/register">Create an account</Link>.<br />
        Forgot your password? <Link href="/forgot-password">Reset it</Link>.
      </p>
    </form>
  );
}
