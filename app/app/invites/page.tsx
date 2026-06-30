import type { Metadata } from "next";
import { InvitesWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Invites"
};

export default function InvitesPage() {
  return <InvitesWorkspace />;
}
