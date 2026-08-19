import type { Metadata } from "next";
import { DocumentsWorkspace } from "@/components/workspaces/reports";

export const metadata: Metadata = {
  title: "Reports"
};

export default function ReportsPage() {
  return <DocumentsWorkspace />;
}
