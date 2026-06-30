import { redirect } from "next/navigation";

export default async function ReportDetailAliasPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  redirect(`/app/reports/${documentId}`);
}
