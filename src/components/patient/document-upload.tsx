"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { cn, formatBytes } from "@/lib/utils";
import type { DocumentCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineAlert } from "@/components/shared/states";
import { DOCUMENT_CATEGORIES } from "@/components/patient/document-categories";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/** Client-side pre-check for a friendlier message; the server re-validates from the file's real bytes. */
export function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!EXTENSIONS.some((ext) => name.endsWith(ext)) || (file.type && !MIME_TYPES.includes(file.type))) {
    return "Unsupported file type. Upload a PDF, PNG, JPG or WebP file.";
  }
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_BYTES) return `That file is ${formatBytes(file.size)}. Files must be 5 MB or smaller.`;
  return null;
}

export function DocumentUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("report");
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const { run, pending, error, reset } = useAsyncAction(async (f: File, c: DocumentCategory) => {
    const form = new FormData();
    form.append("file", f);
    form.append("category", c);
    // No `json` and no Content-Type header: the browser sets the multipart boundary.
    await apiFetch("/api/documents", { method: "POST", body: form });
    return true;
  });

  function choose(next: File | undefined) {
    reset();
    setUploaded(null);
    if (!next) return;
    const problem = validateFile(next);
    setLocalError(problem);
    setFile(problem ? null : next);
    if (problem && inputRef.current) inputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setLocalError("Choose a file to upload.");
      return;
    }
    const name = file.name;
    const ok = await run(file, category);
    if (ok) {
      setUploaded(name);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <label
            htmlFor="doc-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-cyan focus-within:ring-offset-2",
              dragging ? "border-cyan bg-cyan-light" : "border-border bg-soft-blue/40 hover:border-cyan"
            )}
          >
            <FileUp className="h-7 w-7 text-cyan" aria-hidden="true" />
            <span className="font-medium text-navy">{file ? file.name : "Drag a file here, or click to browse"}</span>
            <span className="text-xs text-muted">
              {file ? formatBytes(file.size) : "PDF, PNG, JPG or WebP · up to 5 MB"}
            </span>
            <input
              ref={inputRef}
              id="doc-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              disabled={pending}
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="doc-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)} disabled={pending}>
                <SelectTrigger id="doc-category" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={pending || !file}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Uploading…
                </>
              ) : (
                "Upload document"
              )}
            </Button>
          </div>

          {(localError || error) && <InlineAlert variant="error">{localError ?? error}</InlineAlert>}
          {uploaded && !pending && <InlineAlert variant="success" title="Document uploaded">{uploaded} was added to your records.</InlineAlert>}

          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            Files are stored privately and are only visible to you and the clinicians treating you.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
