"use client";

import { passwordFeedback, passwordRequirements } from "@/lib/password-policy";

/**
 * Mirrors iOS `PasswordFeedbackView`: one segment per requirement, filled as each is met, plus
 * a single sentence. The web previously showed a labelled ✓/○ checklist, which said the same
 * thing at several times the height and made the two platforms read as different products.
 *
 * One hue per state rather than a red/amber/green ramp — the only distinction the form acts on
 * is "usable or not", matching the iOS component's reasoning.
 */
export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;

  const requirements = passwordRequirements(password);
  const satisfied = requirements.filter((requirement) => requirement.met).length;
  const isValid = satisfied === requirements.length;
  const feedback = passwordFeedback(password);

  return (
    <div className={`password-feedback${isValid ? " is-valid" : ""}`}>
      <div className="password-feedback-bars" aria-hidden="true">
        {requirements.map((requirement, index) => (
          <span className={index < satisfied ? "is-filled" : ""} key={requirement.id} />
        ))}
      </div>
      {feedback ? (
        <p
          className="password-feedback-message"
          aria-live="polite"
          // Shape as well as colour, so the state survives a colour-blind read.
          data-state={isValid ? "valid" : "invalid"}
        >
          <span aria-hidden="true">{isValid ? "✓" : "!"}</span>
          {feedback}
        </p>
      ) : null}
      <span className="sr-only">
        {`Password strength: ${satisfied} of ${requirements.length} requirements met. ${feedback}`}
      </span>
    </div>
  );
}
