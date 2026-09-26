import type { Prisma } from "@/generated/prisma/client";
import type {
  AiChatMessage,
  Appointment,
  Doctor,
  MedicalDocumentItem,
  NotificationItem,
  PaymentItem,
  Service,
  ServiceCategory,
  Specialty,
} from "@/types";

export const doctorInclude = {
  user: { select: { name: true } },
  specialty: true,
  availability: { orderBy: { dayOfWeek: "asc" } },
  blockedDates: { orderBy: { date: "asc" } },
} satisfies Prisma.DoctorInclude;

export const appointmentInclude = {
  doctor: { include: { user: { select: { name: true } }, specialty: { select: { name: true } } } },
  service: { select: { name: true } },
} satisfies Prisma.AppointmentInclude;

type DoctorRow = Prisma.DoctorGetPayload<{ include: typeof doctorInclude }>;
type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;
type ServiceRow = Prisma.ServiceGetPayload<{ include: { specialty: { select: { slug: true } } } }>;

export function toSpecialty(s: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}): Specialty {
  return { id: s.id, name: s.name, slug: s.slug, description: s.description ?? "", icon: s.icon ?? "Stethoscope" };
}

export function toService(s: ServiceRow): Service {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category as ServiceCategory,
    description: s.description,
    durationMinutes: s.durationMinutes,
    startingPrice: Number(s.startingPrice),
    specialtySlug: s.specialty.slug,
    suitableSpecialist: s.specialistLabel,
    isActive: s.isActive,
  };
}

export function toDoctor(d: DoctorRow): Doctor {
  return {
    id: d.id,
    name: d.user.name,
    photoUrl: d.photoUrl ?? undefined,
    specialtySlug: d.specialty.slug,
    specialtyName: d.title,
    experienceYears: d.experienceYears,
    qualifications: d.qualifications,
    languages: d.languages,
    bio: d.bio,
    areasOfExpertise: d.areasOfExpertise,
    consultationFee: Number(d.consultationFee),
    rating: Number(d.rating),
    reviewCount: d.reviewCount,
    location: d.location ?? "",
    supportsOnline: d.supportsOnline,
    supportsInPerson: d.supportsInPerson,
    isTemporarilyUnavailable: d.isTemporarilyUnavailable,
    unavailableReason: d.unavailableReason ?? undefined,
    autoConfirm: d.autoConfirm,
    isActive: d.isActive,
    availability: d.availability.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      breakStart: a.breakStart ?? undefined,
      breakEnd: a.breakEnd ?? undefined,
      isActive: a.isActive,
    })),
    holidays: d.blockedDates.map((b) => b.date),
    blockedDates: d.blockedDates.map((b) => ({ date: b.date, kind: b.kind, reason: b.reason ?? undefined })),
  };
}

export function toAppointment(a: AppointmentRow): Appointment {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patientName,
    doctorId: a.doctorId,
    doctorName: a.doctor.user.name,
    specialtyName: a.doctor.specialty.name,
    serviceId: a.serviceId,
    serviceName: a.service.name,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    consultationType: a.consultationType,
    status: a.status,
    notes: a.notes ?? undefined,
    doctorNotes: a.doctorNotes ?? undefined,
    aiSummary: a.aiSummary ?? undefined,
    meetingUrl: a.meetingUrl ?? undefined,
    createdAt: a.createdAt.toISOString(),
  };
}

export function toNotification(n: {
  id: string;
  type: NotificationItem["type"];
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export function toDocument(d: {
  id: string;
  fileName: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  patientId?: string;
}): MedicalDocumentItem {
  return {
    id: d.id,
    fileName: d.fileName,
    category: d.category as MedicalDocumentItem["category"],
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    uploadedAt: d.uploadedAt.toISOString(),
    patientId: d.patientId,
  };
}

export function toMessage(m: {
  id: string;
  sender: "PATIENT" | "AI";
  content: string;
  createdAt: Date;
}): AiChatMessage {
  return { id: m.id, sender: m.sender, content: m.content, createdAt: m.createdAt.toISOString() };
}

export function toPayment(p: {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentItem["status"];
  provider: string;
  createdAt: Date;
  invoice: { invoiceNumber: string } | null;
  appointment?: {
    date: string;
    patientName: string;
    service: { name: string };
    doctor: { user: { name: string } };
  };
}): PaymentItem {
  return {
    id: p.id,
    appointmentId: p.appointmentId,
    patientId: p.patientId,
    patientName: p.appointment?.patientName,
    doctorName: p.appointment?.doctor.user.name,
    serviceName: p.appointment?.service.name,
    appointmentDate: p.appointment?.date,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    provider: p.provider,
    invoiceNumber: p.invoice?.invoiceNumber,
    createdAt: p.createdAt.toISOString(),
  };
}
