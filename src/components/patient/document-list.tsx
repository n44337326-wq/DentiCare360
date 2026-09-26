"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { cn, formatBytes } from "@/lib/utils";
import type { DocumentCategory, MedicalDocumentItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, InlineAlert } from "@/components/shared/states";
import { DOCUMENT_CATEGORIES, categoryLabel } from "@/components/patient/document-categories";

export type DocumentRow = MedicalDocumentItem & { uploadedLabel: string };

type Filter = DocumentCategory | "all";

function DeleteDialog({
  doc,
  onClose,
  onDeleted,
}: {
  doc: DocumentRow | null;
  onClose: () => void;
  onDeleted: (name: string) => void;
}) {
  const { run, pending, error, reset } = useAsyncAction(async (id: string) => {
    await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
    return true;
  });

  function close() {
    if (pending) return;
    reset();
    onClose();
  }

  async function confirm() {
    if (!doc) return;
    if (await run(doc.id)) {
      onDeleted(doc.fileName);
      onClose();
    }
  }

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>
            {doc?.fileName} will be permanently removed from your records. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <InlineAlert variant="error">{error}</InlineAlert>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close} disabled={pending}>
            Keep document
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [toDelete, setToDelete] = useState<DocumentRow | null>(null);
  const [deleted, setDeleted] = useState<string | null>(null);

  const count = (c: Filter) => (c === "all" ? documents.length : documents.filter((d) => d.category === c).length);
  const shown = filter === "all" ? documents : documents.filter((d) => d.category === filter);
  const filters: { value: Filter; label: string }[] = [{ value: "all", label: "All" }, ...DOCUMENT_CATEGORIES];

  return (
    <div className="space-y-4">
      {deleted && <InlineAlert variant="success" title="Document deleted">{deleted} was removed from your records.</InlineAlert>}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload reports, prescriptions or dental records above and they will be listed here."
        />
      ) : (
        <>
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  filter === f.value ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:bg-soft-blue"
                )}
              >
                {f.label} ({count(f.value)})
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState title="Nothing in this category" description="Try another filter, or upload a document." className="py-8" />
          ) : (
            <ul className="space-y-2">
              {shown.map((d) => (
                <li key={d.id}>
                  <Card className="transition-all hover:-translate-y-0.5">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft-blue text-navy">
                          <FileText className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy">{d.fileName}</p>
                          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            <Badge variant="default">{categoryLabel(d.category)}</Badge>
                            <span>{formatBytes(d.sizeBytes)}</span>
                            <span>Uploaded {d.uploadedLabel}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/api/documents/${d.id}`} target="_blank" rel="noopener">
                            <ExternalLink aria-hidden="true" /> View<span className="sr-only"> {d.fileName} (opens in a new tab)</span>
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setToDelete(d)}>
                          <Trash2 aria-hidden="true" /> Delete<span className="sr-only"> {d.fileName}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <DeleteDialog
        doc={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(name) => {
          setDeleted(name);
          router.refresh();
        }}
      />
    </div>
  );
}
