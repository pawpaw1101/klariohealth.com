import type { DocumentStatus } from "@/lib/api/types";

export type BioStatusTone = "blue" | "green" | "yellow" | "orange" | "red" | "gray" | "brand";

export type LabFlag = "low" | "normal" | "high" | "critical";

export type ReviewStatus = "pending" | "confirmed" | "edited" | "rejected";

export function toneForLabFlag(flag: string | null | undefined): BioStatusTone {
  switch (normalize(flag)) {
    case "low":
      return "orange";
    case "normal":
      return "green";
    case "high":
      return "yellow";
    case "critical":
      return "red";
    default:
      return "gray";
  }
}

export function toneForDocumentStatus(status: DocumentStatus | string | null | undefined): BioStatusTone {
  switch (normalize(status)) {
    case "upload_pending":
    case "uploaded":
    case "queued":
    case "ready_for_medical_parse":
      return "gray";
    case "processing":
    case "ocr_processing":
    case "ocr_completed":
    case "medical_parsing":
      return "blue";
    case "needs_attention":
      return "orange";
    case "parsed":
    case "parsed_empty":
      return "green";
    case "upload_failed":
    case "ocr_failed":
    case "medical_parse_failed":
    case "failed":
      return "red";
    default:
      return "gray";
  }
}

export function toneForReviewStatus(status: string | null | undefined): BioStatusTone {
  switch (normalize(status)) {
    case "pending":
    case "open":
      return "orange";
    case "confirmed":
    case "accepted":
    case "resolved":
    case "completed":
      return "green";
    case "edited":
    case "processing":
    case "queued":
    case "started":
      return "blue";
    case "rejected":
    case "failed":
      return "red";
    default:
      return "gray";
  }
}

export function toneForStatus(value: string | null | undefined): BioStatusTone {
  const status = normalize(value);

  if (status === "low" || status === "normal" || status === "high" || status === "critical") {
    return toneForLabFlag(status);
  }

  if (
    status === "pending" ||
    status === "open" ||
    status === "confirmed" ||
    status === "accepted" ||
    status === "resolved" ||
    status === "edited" ||
    status === "rejected" ||
    status === "completed" ||
    status === "started"
  ) {
    return toneForReviewStatus(status);
  }

  return toneForDocumentStatus(status);
}

export function toneClass(tone: BioStatusTone): string {
  return `tone-${tone}`;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
