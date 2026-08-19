import type { Metadata } from "next";
import { DashboardWorkspace } from "@/components/workspaces/dashboard";

export const metadata: Metadata = {
  title: "Home"
};

export default function DashboardPage() {
  return <DashboardWorkspace />;
}
