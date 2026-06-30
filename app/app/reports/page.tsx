import type { Metadata } from "next";
import { DocumentsWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Reports"
};

export default function ReportsPage() {
  return <DocumentsWorkspace />;
}
