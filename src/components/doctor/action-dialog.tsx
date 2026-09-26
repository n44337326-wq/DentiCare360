"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineAlert } from "@/components/shared/states";

/**
 * Shared dialog frame: title, description, body, an error banner and a
 * cancel / confirm footer whose confirm button shows a pending state.
 */
export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  pending,
  error,
  onSubmit,
  destructive,
  submitDisabled,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  destructive?: boolean;
  submitDisabled?: boolean;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent
        className={`max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">
            {children}
            {error && <InlineAlert variant="error">{error}</InlineAlert>}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={pending || submitDisabled}
              aria-busy={pending}
            >
              {pending && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {pending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
