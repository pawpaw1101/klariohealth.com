"use client";

import { passwordFeedback, passwordRequirements } from "@/lib/password-policy";

export function PasswordRequirements({ password }: { password: string }) {
  const feedback = passwordFeedback(password);
  if (!password) return null;
  return (
    <div className="password-requirements" aria-live="polite" aria-label="Password requirements">
      <strong>Password requirements</strong>
      <ul>
        {passwordRequirements(password).map((requirement) => (
          <li key={requirement.id} className={requirement.met ? "is-met" : ""}>
            <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>{requirement.label}
          </li>
        ))}
      </ul>
      <p>{feedback}</p>
    </div>
  );
}
