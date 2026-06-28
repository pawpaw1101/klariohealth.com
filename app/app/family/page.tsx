import type { Metadata } from "next";
import { FamilyWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Family"
};

export default function FamilyPage() {
  return <FamilyWorkspace />;
}
