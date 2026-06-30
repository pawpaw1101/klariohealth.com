import { ApiError, resolveExternalOrRelativeUrl, safeApiMessage } from "@/lib/api/client";
import { documentsApi, parseApi } from "@/lib/api/klario-api";
import type { Document as KlarioDocument, DocumentStatus, DocumentType } from "@/lib/api/types";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_REPORT_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"]);

export type UploadPhase =
  | "validating"
  | "hashing"
  | "intent"
  | "uploading"
  | "verifying"
  | "ocr"
  | "waiting_for_ocr"
  | "medical_parse"
  | "waiting_for_medical_parse"
  | "complete";

export type UploadStatusUpdate = {
  phase: UploadPhase;
  message: string;
  document?: KlarioDocument | null;
};

export type UploadAndParseOptions = {
  familyId: string;
  memberId: string;
  file: File;
  title?: string;
  documentType?: DocumentType;
  pollIntervalMs?: number;
  timeoutMs?: number;
  onStatus?: (update: UploadStatusUpdate) => void;
};

const OCR_READY_STATUSES = new Set<DocumentStatus>(["ready_for_medical_parse", "needs_attention", "parsed", "parsed_empty"]);
const FINAL_STATUSES = new Set<DocumentStatus>(["parsed", "parsed_empty", "needs_attention", "ocr_failed", "medical_parse_failed", "failed"]);
const FAILURE_STATUSES = new Set<DocumentStatus>(["ocr_failed", "medical_parse_failed", "failed", "upload_failed"]);
const MEDICAL_PARSE_ELIGIBLE_STATUSES = new Set<DocumentStatus>(["ready_for_medical_parse", "needs_attention", "parsed_empty"]);

export function validateReportFile(file: File) {
  if (!ALLOWED_REPORT_MIME_TYPES.has(file.type)) {
    throw new ApiError(422, "unsupported_file_type", safeApiMessage("unsupported_file_type"));
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(422, "file_too_large", safeApiMessage("file_too_large"));
  }
}

export async function uploadAndParseReport({
  familyId,
  memberId,
  file,
  title,
  documentType = "lab_report",
  pollIntervalMs = 2500,
  timeoutMs = 180000,
  onStatus
}: UploadAndParseOptions) {
  onStatus?.({ phase: "validating", message: "Checking file" });
  validateReportFile(file);

  onStatus?.({ phase: "hashing", message: "Preparing secure upload" });
  const checksum = await sha256File(file);

  onStatus?.({ phase: "intent", message: "Creating upload" });
  const intent = await documentsApi.uploadIntent(familyId, {
    family_member_id: memberId,
    title: title?.trim() || file.name,
    document_type: documentType,
    original_filename: file.name,
    content_type: file.type,
    file_size: file.size,
    checksum_sha256: checksum
  });

  onStatus?.({ phase: "uploading", message: "Uploading report" });
  const uploadHeaders = new Headers(intent.upload.required_headers);
  if (!uploadHeaders.has("Content-Type")) {
    uploadHeaders.set("Content-Type", file.type);
  }

  const uploadResponse = await fetch(resolveExternalOrRelativeUrl(intent.upload.upload_url), {
    method: "PUT",
    body: file,
    headers: uploadHeaders
  });

  if (!uploadResponse.ok) {
    throw new ApiError(uploadResponse.status, "upload_verification_failed", safeApiMessage("upload_verification_failed"));
  }

  onStatus?.({ phase: "verifying", message: "Verifying upload" });
  await documentsApi.uploadComplete(intent.document.id, { checksum_sha256: checksum });

  onStatus?.({ phase: "ocr", message: "Starting OCR" });
  await createJobOrContinue(() => parseApi.createOcrJob(intent.document.id));

  onStatus?.({ phase: "waiting_for_ocr", message: "Reading report" });
  const afterOcr = await pollDocumentStatus(
    intent.document.id,
    (document) => OCR_READY_STATUSES.has(document.status) || FAILURE_STATUSES.has(document.status),
    pollIntervalMs,
    timeoutMs
  );

  if (FAILURE_STATUSES.has(afterOcr.status)) {
    throw new ApiError(422, "invalid_document_state", safeApiMessage("invalid_document_state"));
  }

  if (MEDICAL_PARSE_ELIGIBLE_STATUSES.has(afterOcr.status)) {
    onStatus?.({ phase: "medical_parse", message: "Extracting medical results", document: afterOcr });
    await createJobOrContinue(() => parseApi.createMedicalJob(afterOcr.id));

    onStatus?.({ phase: "waiting_for_medical_parse", message: "Building health record", document: afterOcr });
    const finalDocument = await pollDocumentStatus(
      afterOcr.id,
      (document) => FINAL_STATUSES.has(document.status),
      pollIntervalMs,
      timeoutMs
    );

    if (FAILURE_STATUSES.has(finalDocument.status)) {
      throw new ApiError(422, "invalid_document_state", safeApiMessage("invalid_document_state"));
    }

    onStatus?.({ phase: "complete", message: "Report processed", document: finalDocument });
    return finalDocument;
  }

  onStatus?.({ phase: "complete", message: "Report processed", document: afterOcr });
  return afterOcr;
}

export async function pollDocumentStatus(
  documentId: string,
  isDone: (document: KlarioDocument) => boolean,
  intervalMs = 2500,
  timeoutMs = 180000
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const document = await documentsApi.get(documentId);
    if (isDone(document)) {
      return document;
    }
    await delay(intervalMs);
  }

  throw new ApiError(408, "internal_error", "Processing is taking longer than expected. Please check the report again shortly.");
}

async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createJobOrContinue<T>(createJob: () => Promise<T>) {
  try {
    return await createJob();
  } catch (error) {
    if (error instanceof ApiError && error.code === "duplicate_active_parse_job") {
      return null;
    }
    throw error;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
