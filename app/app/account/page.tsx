import type { Metadata } from "next";
import { AccountWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Profile"
};

export default function AccountPage() {
  return <AccountWorkspace />;
}
