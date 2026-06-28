export const publicNav = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" }
];

export const appNav = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Documents", href: "/app/documents" },
  { label: "Upload", href: "/app/upload" },
  { label: "Timeline", href: "/app/timeline" },
  { label: "Trends", href: "/app/trends" },
  { label: "Family", href: "/app/family" }
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

export const appMetrics = [
  { value: "14", label: "Documents", body: "Reports saved in Klario." },
  { value: "3", label: "Review needed", body: "Values waiting for confirmation." },
  { value: "2", label: "Out-of-range labs", body: "Results outside reference range." },
  { value: "4", label: "Recommendations", body: "Suggested follow-up items." }
];

export const documents = [
  {
    title: "CBC + Ferritin Panel",
    source: "Apollo Diagnostics",
    date: "18 May 2025",
    owner: "Joel",
    status: "Needs review",
    summary: "Ferritin below range. Three extracted values need confirmation.",
    tags: ["Ferritin low", "CBC", "Review"]
  },
  {
    title: "Pediatric Visit - May 2025",
    source: "Fortis Hospital",
    date: "15 May 2025",
    owner: "Mia",
    status: "Saved",
    summary: "Visit notes, medication plan, and growth metrics saved to timeline.",
    tags: ["Visit", "Medication", "Timeline"]
  },
  {
    title: "Iron + Vitamin D",
    source: "Thyrocare",
    date: "10 April 2025",
    owner: "Joel",
    status: "Watch",
    summary: "Vitamin D marked as watch with a repeat-test reminder.",
    tags: ["Vitamin D", "Iron", "Watch"]
  },
  {
    title: "Annual Wellness Panel",
    source: "CityLab",
    date: "3 February 2025",
    owner: "Dad",
    status: "Saved",
    summary: "Metabolic markers, lipids, and HbA1c added to long-term trends.",
    tags: ["HbA1c", "Lipids", "Saved"]
  }
];

export const timelineEvents = [
  {
    date: "18 May 2025",
    title: "CBC + Ferritin Panel",
    body: "Apollo Diagnostics. Ferritin low and awaiting review."
  },
  {
    date: "15 May 2025",
    title: "Pediatric check-up",
    body: "Fortis Hospital. Dr. Gupta. Visit notes added for Mia."
  },
  {
    date: "10 April 2025",
    title: "Thyroid + Vitamin D",
    body: "Thyrocare. Vitamin D borderline with repeat-test reminder."
  },
  {
    date: "8 April 2025",
    title: "Amoxicillin 250mg",
    body: "Seven-day course recorded as a medication event."
  },
  {
    date: "3 February 2025",
    title: "Iron panel",
    body: "Thyrocare. All values in range."
  }
];

export const biomarkerTrends = [
  {
    name: "Ferritin",
    value: "22",
    unit: "ng/mL",
    range: "30-400 ng/mL",
    status: "Low",
    description: "Iron storage marker trending below the reference range.",
    points: [34, 31, 28, 26, 24, 22]
  },
  {
    name: "Vitamin D (25-OH)",
    value: "24",
    unit: "ng/mL",
    range: "30-100 ng/mL",
    status: "Watch",
    description: "Borderline value with a repeat-test reminder queued.",
    points: [18, 21, 26, 24]
  },
  {
    name: "Haemoglobin",
    value: "12.4",
    unit: "g/dL",
    range: "11.5-16.0 g/dL",
    status: "In range",
    description: "Stable across the last five reports.",
    points: [12.0, 12.2, 12.1, 12.5, 12.4]
  },
  {
    name: "WBC",
    value: "7.2",
    unit: "x10^9/L",
    range: "4.0-11.0 x10^9/L",
    status: "In range",
    description: "White blood cell count remains within range.",
    points: [6.4, 7.1, 6.9, 7.5, 7.2]
  }
];

export const familyProfiles = [
  { name: "Joel", role: "Workspace owner", detail: "Adult profile", documents: 8 },
  { name: "Mia", role: "Child", detail: "Eight years old", documents: 3 },
  { name: "Dad", role: "Parent", detail: "Sixty two years old", documents: 2 },
  { name: "Mom", role: "Parent", detail: "Fifty eight years old", documents: 1 },
  { name: "Pet profile", role: "Companion care", detail: "Species selected before upload", documents: 0 }
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
