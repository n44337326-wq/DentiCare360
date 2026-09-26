import { db } from "@/database/client";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { SessionUser } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DocumentCategory, MedicalDocumentItem } from "@/types";
import { audit } from "@/services/audit";
import { toDocument } from "@/services/mappers";
import {
  ALLOWED_TYPES,
  MAX_UPLOAD_BYTES,
  deleteStoredFile,
  readStoredFile,
  sanitizeFileName,
  saveFile,
  sniffMimeType,
} from "@/services/storage";

const MAX_DOCUMENTS_PER_PATIENT = 100;

export async function listDocumentsForPatient(patientId: string): Promise<MedicalDocumentItem[]> {
  const rows = await db.medicalDocument.findMany({ where: { patientId }, orderBy: { uploadedAt: "desc" } });
  return rows.map(toDocument);
}

export async function uploadDocument(
  user: SessionUser,
  file: { name: string; bytes: Uint8Array },
  category: DocumentCategory,
  ip?: string
): Promise<MedicalDocumentItem> {
  if (user.role !== "PATIENT" || !user.patientId) throw new ForbiddenError("Only patients can upload documents.");
  enforceRateLimit({ scope: "document-upload", key: user.id, limit: 20, windowMs: 60 * 60_000 });

  if (file.bytes.byteLength === 0) throw new ValidationError("That file is empty.");
  if (file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ValidationError(`Files must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller.`);
  }
  const mime = sniffMimeType(file.bytes);
  if (!mime) throw new ValidationError(`Unsupported file type. Upload ${Object.values(ALLOWED_TYPES).join(", ").toUpperCase()} files only.`);

  const count = await db.medicalDocument.count({ where: { patientId: user.patientId } });
  if (count >= MAX_DOCUMENTS_PER_PATIENT) throw new ConflictError("Document limit reached. Delete an old file first.", "LIMIT_REACHED");

  const storageKey = await saveFile(file.bytes, mime);
  const row = await db.medicalDocument.create({
    data: {
      patientId: user.patientId,
      fileName: sanitizeFileName(file.name),
      storageKey,
      mimeType: mime,
      sizeBytes: file.bytes.byteLength,
      category,
    },
  });
  await audit({ userId: user.id, action: "DOCUMENT_UPLOADED", entityType: "MedicalDocument", entityId: row.id, ipAddress: ip });
  return toDocument(row);
}

/** Whether the viewer may open a given patient's documents. */
async function canAccessPatientDocuments(user: SessionUser, patientId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "PATIENT") return user.patientId === patientId;
  if (user.role === "DOCTOR" && user.doctorId) {
    const relationship = await db.appointment.findFirst({ where: { doctorId: user.doctorId, patientId }, select: { id: true } });
    return !!relationship;
  }
  return false;
}

export async function getDocumentFile(user: SessionUser, id: string, ip?: string) {
  const doc = await db.medicalDocument.findUnique({ where: { id } });
  // Same response for "missing" and "not yours" so ids cannot be probed.
  if (!doc || !(await canAccessPatientDocuments(user, doc.patientId))) throw new NotFoundError("Document not found.");

  const bytes = await readStoredFile(doc.storageKey).catch(() => {
    throw new NotFoundError("The stored file is unavailable.");
  });
  await audit({ userId: user.id, action: "DOCUMENT_VIEWED", entityType: "MedicalDocument", entityId: id, ipAddress: ip });
  return { fileName: doc.fileName, mimeType: doc.mimeType, bytes };
}

export async function deleteDocument(user: SessionUser, id: string, ip?: string) {
  const doc = await db.medicalDocument.findUnique({ where: { id } });
  if (!doc || user.role !== "PATIENT" || user.patientId !== doc.patientId) throw new NotFoundError("Document not found.");
  await db.medicalDocument.delete({ where: { id } });
  await deleteStoredFile(doc.storageKey);
  await audit({ userId: user.id, action: "DOCUMENT_DELETED", entityType: "MedicalDocument", entityId: id, ipAddress: ip });
}
