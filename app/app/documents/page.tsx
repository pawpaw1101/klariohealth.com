import type { Metadata } from "next";
import { DocumentsWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Documents"
};

export default function DocumentsPage() {
  return <DocumentsWorkspace />;
}
