import type { Metadata } from "next";
import { FamilyWorkspace } from "@/components/workspaces/family";

export const metadata: Metadata = {
  title: "Family"
};

export default function FamilyPage() {
  return <FamilyWorkspace />;
}
