import { redirect } from "next/navigation";

export default async function TrendDetailAliasPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;
  redirect(`/app/trends/${metricId}`);
}
