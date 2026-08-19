import type { Metadata } from "next";
import { OnboardingWorkspace } from "@/components/workspaces/onboarding";

export const metadata: Metadata = {
  title: "Set Up"
};

export default function OnboardingPage() {
  return <OnboardingWorkspace />;
}
