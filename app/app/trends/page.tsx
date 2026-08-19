import type { Metadata } from "next";
import { TrendsWorkspace } from "@/components/workspaces/trends";

export const metadata: Metadata = {
  title: "Trends"
};

export default function TrendsPage() {
  return <TrendsWorkspace />;
}
