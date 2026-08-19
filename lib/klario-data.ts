import type { KlarioIconName } from "@/lib/icons";

export const publicNav = [
  { label: "Product", href: "/features", icon: "product" },
  { label: "About", href: "/about", icon: "info" }
];

export const appNav = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Trends", href: "/app/trends" },
  { label: "Reports", href: "/app/reports" },
  { label: "Family", href: "/app/family" },
  { label: "Settings", href: "/app/settings" }
];

export const featureSnapshots = [
  {
    title: "Upload reports",
    body: "Bring in medical reports from photos, PDFs, pasted text, or forwarded emails."
  },
  {
    title: "Track changes over time",
    body: "Turn repeated lab results into trend lines that show when a value started moving."
  },
  {
    title: "Review values before saving",
    body: "Check uncertain extractions and out-of-range results before they enter the record."
  },
  {
    title: "Understand each result",
    body: "Plain-language explanations add context around what a marker tracks and why it may matter."
  },
  {
    title: "Keep family records separate",
    body: "Manage parents, children, partners, and pets in one account without mixing records."
  },
  {
    title: "Build a timeline",
    body: "Keep reports, visits, medications, vaccines, and lab panels in chronological order."
  }
];

export const productUseCases: Array<{ title: string; body: string; icon: KlarioIconName }> = [
  {
    title: "Track long-term biomarkers",
    body: "Follow HbA1c, ferritin, vitamin D, thyroid, cholesterol, CBC, and other repeated values across reports.",
    icon: "icon_tab_trends"
  },
  {
    title: "Prepare for doctor visits",
    body: "Bring a cleaner view of recent reports, flagged values, and timeline context into appointments.",
    icon: "icon_med_visit"
  },
  {
    title: "Care for parents",
    body: "Keep older family members' reports organized and compare changes without hunting through old files.",
    icon: "icon_tab_family"
  },
  {
    title: "Manage child records",
    body: "Store visits, prescriptions, vaccines, growth metrics, and lab reports in one chronological record.",
    icon: "icon_med_vaccine"
  },
  {
    title: "Review new reports faster",
    body: "See what needs attention, what changed, and which values should be confirmed before saving.",
    icon: "icon_review_required"
  },
  {
    title: "Build a family timeline",
    body: "Connect reports, appointments, medications, and notes by date while keeping profiles separate.",
    icon: "icon_timeline_empty"
  }
];

export const uploadMethods = [
  {
    title: "Take photo",
    body: "Scan a report or prescription with the camera."
  },
  {
    title: "Choose from photos",
    body: "Select an existing report image."
  },
  {
    title: "Upload file or PDF",
    body: "Import from files, desktop, or drive."
  },
  {
    title: "Paste text",
    body: "Copy report content directly into Klario."
  },
  {
    title: "Import from email",
    body: "Forward lab report email content."
  },
  {
    title: "Select family member",
    body: "Assign the report to the correct person or pet before parsing."
  }
];
