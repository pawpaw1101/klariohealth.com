"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";

export function RegisterForm() {
  const router = useRouter();
  const { registerAndLogin } = useKlarioApi();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await registerAndLogin({ full_name: fullName, email, password });
      window.dispatchEvent(new Event("klario:navigation-start"));
      window.setTimeout(() => router.push("/app/dashboard"), 420);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Please check your information and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-panel form-grid" onSubmit={onSubmit}>
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
          minLength={8}
          maxLength={128}
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="form-alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <BioIcon name="icon_action_loading" size={17} />
            Creating account
          </>
        ) : (
          <>
            Create account
            <BioIcon name="icon_action_continue" size={17} />
          </>
        )}
      </button>
      <p className="note">
        Already have an account? <Link href="/login">Sign in</Link>. Klario signs you in after registration because the backend returns the user, not a token.
      </p>
    </form>
  );
}
