import type { Metadata } from "next";
import { FamilyProfileDetailWorkspace } from "@/components/workspaces/family";

export const metadata: Metadata = {
  title: "Family Profile"
};

export default async function FamilyMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return <FamilyProfileDetailWorkspace memberId={memberId} />;
}
