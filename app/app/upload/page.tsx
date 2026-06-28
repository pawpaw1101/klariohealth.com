import type { Metadata } from "next";
import { UploadWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Upload"
};

export default function UploadPage() {
  return <UploadWorkspace />;
}
