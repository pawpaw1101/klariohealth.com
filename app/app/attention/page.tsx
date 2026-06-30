import type { Metadata } from "next";
import { AttentionWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Attention"
};

export default function AttentionPage() {
  return <AttentionWorkspace />;
}
