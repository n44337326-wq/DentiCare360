import type { DocumentCategory } from "@/types";

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "report", label: "Report" },
  { value: "prescription", label: "Prescription" },
  { value: "dental_record", label: "Dental record" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (c: DocumentCategory) => DOCUMENT_CATEGORIES.find((x) => x.value === c)?.label ?? "Other";
