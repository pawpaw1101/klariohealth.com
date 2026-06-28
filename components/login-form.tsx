"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BioIcon } from "@/components/bio-icon";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => router.push("/app/dashboard"), 420);
  };

  return (
    <form className="form-panel form-grid" onSubmit={onSubmit}>
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
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <BioIcon name="icon_action_confirm_safe" size={17} />
            Opening app
          </>
        ) : (
          <>
            Continue to web app
            <BioIcon name="icon_action_continue" size={17} />
          </>
        )}
      </button>
      <p className="note">Account creation and secure login happen here before you enter your private workspace.</p>
    </form>
  );
}
