import { NextResponse } from "next/server";
import { apiHandler, clientIp, json } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { deleteDocument, getDocumentFile } from "@/services/documents";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Authorised download. Files are stored privately and only ever streamed through
 * here after an ownership / treating-doctor check (and an audit log entry).
 */
export const GET = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const file = await getDocumentFile(user, id, clientIp(req));
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Content-Length": String(file.bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
      // Stops any script in an uploaded file from running in our origin.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
});

export const DELETE = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteDocument(user, id, clientIp(req));
  return json({ ok: true });
});
