export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRequirement = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: "length", label: `${PASSWORD_MIN_LENGTH}+ characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: "uppercase", label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Lowercase letter", met: /[a-z]/.test(password) },
    { id: "number", label: "Number", met: /\d/.test(password) },
    { id: "special", label: "Special character", met: /[^\p{L}\p{N}\s]/u.test(password) }
  ];
}

export function isAcceptablePassword(password: string) {
  return password.length <= PASSWORD_MAX_LENGTH && passwordRequirements(password).every((requirement) => requirement.met);
}

export function passwordFeedback(password: string) {
  if (!password) return "";
  if (password.length > PASSWORD_MAX_LENGTH) return `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  const missing = passwordRequirements(password).filter((requirement) => !requirement.met);
  if (!missing.length) return "This password meets every requirement.";
  return missing.length >= 3
    ? "Use at least 12 characters with uppercase, lowercase, numbers, and special symbols (e.g. @, #, !, $)."
    : `Still needed: ${missing.map((requirement) => requirement.label.toLowerCase()).join(" and ")}.`;
}

export function isValidEmail(email: string) {
  const normalized = email.trim();
  return normalized.includes("@") && normalized.includes(".");
}

export function maskEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@");
  return local && domain ? `${local[0]}••••@${domain}` : email;
}
