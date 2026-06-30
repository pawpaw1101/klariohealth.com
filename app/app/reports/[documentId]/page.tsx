import type { Metadata } from "next";
import { ReportDetailWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Report Detail"
};

export default async function ReportDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <ReportDetailWorkspace documentId={documentId} />;
}
