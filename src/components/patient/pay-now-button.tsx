"use client";

import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";

/**
 * Settles a pending fee through the server-side payment provider. No card
 * details are collected here: the request has no body at all.
 */
export function PayNowButton({ paymentId, label }: { paymentId: string; label: string }) {
  const router = useRouter();
  const { run, pending, error } = useAsyncAction(async () => {
    await apiFetch(`/api/payments/${paymentId}/pay`, { method: "POST" });
    return true;
  });

  async function pay() {
    if (await run()) {
      // The page reads ?paid=1 to show a success banner after the refresh.
      router.replace("/patient/payments?paid=1");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={pay} disabled={pending} aria-label={`Pay now: ${label}`}>
        {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
        {pending ? "Processing…" : "Pay now"}
      </Button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
