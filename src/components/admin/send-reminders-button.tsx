"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/shared/states";

/** Triggers reminders for appointments starting within 24 hours that have not been reminded yet. */
export function SendRemindersButton() {
  const router = useRouter();
  const [sent, setSent] = useState<number | null>(null);
  const send = useCallback(async () => (await apiFetch<{ sent: number }>("/api/admin/reminders", { method: "POST" })).sent, []);
  const { run, pending, error } = useAsyncAction(send);

  async function onClick() {
    setSent(null);
    const count = await run();
    if (count !== undefined) {
      setSent(count);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={onClick} disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <BellRing aria-hidden="true" />}
        {pending ? "Sending reminders…" : "Send due reminders"}
      </Button>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {sent !== null && (
        <InlineAlert variant="success">
          {sent === 0 ? "No reminders were due." : `Sent ${sent} reminder${sent === 1 ? "" : "s"}.`}
        </InlineAlert>
      )}
    </div>
  );
}
