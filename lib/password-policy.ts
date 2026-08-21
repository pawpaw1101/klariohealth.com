export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** Verbatim from iOS `KlarioPasswordPolicy.summary`. */
export const PASSWORD_SUMMARY =
  `Use at least ${PASSWORD_MIN_LENGTH} characters with a mix of uppercase, lowercase, numbers, and special symbols (e.g. @, #, !, $).`;

export type PasswordRequirement = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  /** Short form, for a compact list. Mirrors iOS `Requirement.title`. */
  label: string;
  /** Sentence form, for "Still needed: …". Mirrors iOS `Requirement.shortfall`. */
  shortfall: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: "length", label: `${PASSWORD_MIN_LENGTH}+ characters`, shortfall: `at least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: "uppercase", label: "Uppercase letter", shortfall: "an uppercase letter", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Lowercase letter", shortfall: "a lowercase letter", met: /[a-z]/.test(password) },
    { id: "number", label: "Number", shortfall: "a number", met: /\d/.test(password) },
    { id: "special", label: "Special character", shortfall: "a special symbol (@, #, !, $)", met: /[^\p{L}\p{N}\s]/u.test(password) }
  ];
}

/** iOS `KlarioPasswordPolicy.joined`: only ever one or two phrases, so `a` / `a and b`. */
function joinPhrases(phrases: string[]) {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0];
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

export function isAcceptablePassword(password: string) {
  return password.length <= PASSWORD_MAX_LENGTH && passwordRequirements(password).every((requirement) => requirement.met);
}

export function passwordFeedback(password: string) {
  if (!password) return "";
  if (password.length > PASSWORD_MAX_LENGTH) return `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  const missing = passwordRequirements(password).filter((requirement) => !requirement.met);
  if (!missing.length) return "This password meets every requirement.";
  // Wording is iOS's, verbatim: at three or more gaps the specific list reads like a
  // scolding and the summary is what a user actually reads.
  return missing.length >= 3
    ? PASSWORD_SUMMARY
    : `Still needed: ${joinPhrases(missing.map((requirement) => requirement.shortfall))}.`;
}

export function isValidEmail(email: string) {
  const normalized = email.trim();
  return normalized.includes("@") && normalized.includes(".");
}

export function maskEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@");
  return local && domain ? `${local[0]}••••@${domain}` : email;
}
