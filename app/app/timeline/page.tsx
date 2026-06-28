import type { Metadata } from "next";
import { TimelineWorkspace } from "@/components/app-workspaces";

export const metadata: Metadata = {
  title: "Timeline"
};

export default function TimelinePage() {
  return <TimelineWorkspace />;
}
