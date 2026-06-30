import type { Metadata } from "next";
import { TrendDetailWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Trend Detail"
};

export default async function TrendDetailPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;
  return <TrendDetailWorkspace metricId={metricId} />;
}
