import type { DocumentStatus, DocumentType } from "@/lib/api/types";

export type KlarioIconName =
  | "icon_tab_dashboard"
  | "icon_tab_documents"
  | "icon_tab_review"
  | "icon_tab_trends"
  | "icon_tab_family"
  | "icon_tab_settings"
  | "icon_med_lab_report"
  | "icon_med_prescription"
  | "icon_med_discharge"
  | "icon_med_imaging"
  | "icon_med_visit"
  | "icon_med_vaccine"
  | "icon_med_growth"
  | "icon_doc_invoice"
  | "icon_doc_generic"
  | "icon_action_confirm"
  | "icon_action_confirm_safe"
  | "icon_action_edit"
  | "icon_action_reject"
  | "icon_action_add"
  | "icon_action_delete"
  | "icon_action_rerun"
  | "icon_action_continue"
  | "icon_action_loading"
  | "icon_doc_add_empty"
  | "icon_doc_scan_import"
  | "icon_doc_choose_file"
  | "icon_doc_missing_file"
  | "icon_doc_latest_import"
  | "icon_review_required"
  | "icon_signal_summary"
  | "icon_signal_insights"
  | "icon_parser_confidence"
  | "icon_timeline_empty"
  | "icon_family_header"
  | "icon_family_add"
  | "icon_family_empty"
  | "icon_family_filter"
  | "icon_family_remove_draft"
  | "icon_filter_type"
  | "icon_filter_status"
  | "icon_filter_metric"
  | "icon_filter_clear"
  | "icon_zone_cardio"
  | "icon_zone_metabolic"
  | "icon_zone_kidney"
  | "icon_zone_blood"
  | "icon_zone_brain"
  | "icon_zone_thyroid"
  | "icon_zone_liver"
  | "icon_zone_inflammation"
  | "icon_flag_attention"
  | "icon_flag_score";

export type ReviewStatus = "pending" | "confirmed" | "edited" | "rejected";

export type TimelineCategory = "labs" | "visits" | "medications" | "vaccines" | "growth_records";

export const documentTypeIconMap = {
  lab_report: "icon_med_lab_report",
  prescription: "icon_med_prescription",
  discharge: "icon_med_discharge",
  imaging: "icon_med_imaging",
  vaccination: "icon_med_vaccine",
  invoice: "icon_doc_invoice",
  general: "icon_doc_generic"
} satisfies Record<DocumentType, KlarioIconName>;

export const documentStatusIconMap = {
  upload_pending: "icon_doc_latest_import",
  uploaded: "icon_doc_latest_import",
  upload_failed: "icon_review_required",
  queued: "icon_doc_latest_import",
  processing: "icon_action_loading",
  ocr_processing: "icon_action_loading",
  ocr_completed: "icon_action_confirm_safe",
  ready_for_medical_parse: "icon_doc_latest_import",
  ocr_failed: "icon_review_required",
  medical_parsing: "icon_action_loading",
  medical_parse_failed: "icon_review_required",
  parsed: "icon_action_confirm_safe",
  parsed_empty: "icon_action_confirm_safe",
  needs_attention: "icon_review_required",
  failed: "icon_review_required"
} satisfies Record<DocumentStatus, KlarioIconName>;

export const reviewStatusIconMap = {
  pending: "icon_review_required",
  confirmed: "icon_action_confirm_safe",
  edited: "icon_action_edit",
  rejected: "icon_action_reject"
} satisfies Record<ReviewStatus, KlarioIconName>;

export const timelineCategoryIconMap = {
  labs: "icon_med_lab_report",
  visits: "icon_med_visit",
  medications: "icon_med_prescription",
  vaccines: "icon_med_vaccine",
  growth_records: "icon_med_growth"
} satisfies Record<TimelineCategory, KlarioIconName>;
