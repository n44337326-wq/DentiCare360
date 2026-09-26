import { InlineAlert } from "@/components/shared/states";

/** Shown on the AI conversation pages: they hold patient-reported health information and access is audit-logged. */
export function SensitiveNotice() {
  return (
    <InlineAlert variant="info" title="Sensitive information — access is audit-logged" className="mb-6">
      AI conversations contain health details reported by patients or guests. Opening a conversation is recorded in the audit log.
      Everything here is patient-reported and is not a confirmed diagnosis.
    </InlineAlert>
  );
}
