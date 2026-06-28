import type { Metadata } from "next";
import { TrendsWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Trends"
};

export default function TrendsPage() {
  return <TrendsWorkspace />;
}
