import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Klario handles account, family profile, and health report information."
};

export default function PrivacyPolicyPage() {
  return <LegalDocument kind="privacy" />;
}
