import { apiHandler, clientIp, json, parseWith } from "@/lib/http";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { requireRole } from "@/lib/guards";
import { documentCategorySchema } from "@/lib/validation";
import { MAX_UPLOAD_BYTES } from "@/services/storage";
import { listDocumentsForPatient, uploadDocument } from "@/services/documents";

export const GET = apiHandler(async () => {
  const user = await requireRole("PATIENT");
  if (!user.patientId) throw new ForbiddenError();
  return json({ documents: await listDocumentsForPatient(user.patientId) });
});

/** Multipart upload: `file` (PDF/PNG/JPEG/WebP, up to 5 MB) and `category`. The type is verified from the file's bytes. */
export const POST = apiHandler(async (req) => {
  const user = await requireRole("PATIENT");

  // Reject oversized bodies before buffering them.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) throw new ValidationError("That file is too large (5 MB maximum).");

  const form = await req.formData().catch(() => {
    throw new ValidationError("Expected a multipart form upload.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Choose a file to upload.");
  const category = parseWith(documentCategorySchema, form.get("category"));

  const bytes = new Uint8Array(await file.arrayBuffer());
  const document = await uploadDocument(user, { name: file.name, bytes }, category, clientIp(req));
  return json({ document }, 201);
});
