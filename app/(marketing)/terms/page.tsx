import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms for using Klario’s health report organization service."
};

export default function TermsOfServicePage() {
  return <LegalDocument kind="terms" />;
}
