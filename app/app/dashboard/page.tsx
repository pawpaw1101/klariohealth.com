import type { Metadata } from "next";
import { DashboardWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default function DashboardPage() {
  return <DashboardWorkspace />;
}
