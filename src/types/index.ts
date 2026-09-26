export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export type ConsultationType = "IN_PERSON" | "ONLINE";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW";

export type UrgencyLevel = "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";

export type BlockKind = "HOLIDAY" | "LEAVE" | "BLOCKED";

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export type ServiceCategory = "Dental" | "Skin & Dermatology" | "General Health";

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  startingPrice: number;
  specialtySlug: string;
  suitableSpecialist: string;
  isActive: boolean;
}

export interface DoctorAvailabilityDay {
  dayOfWeek: number; // 0=Sun..6=Sat
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
}

export interface BlockedDate {
  date: string;
  kind: BlockKind;
  reason?: string;
}

export interface Doctor {
  id: string;
  name: string;
  photoUrl?: string;
  specialtySlug: string;
  specialtyName: string;
  experienceYears: number;
  qualifications: string[];
  languages: string[];
  bio: string;
  areasOfExpertise: string[];
  consultationFee: number;
  rating: number;
  reviewCount: number;
  location: string;
  supportsOnline: boolean;
  supportsInPerson: boolean;
  isTemporarilyUnavailable: boolean;
  unavailableReason?: string;
  autoConfirm: boolean;
  isActive: boolean;
  availability: DoctorAvailabilityDay[];
  /** Dates (YYYY-MM-DD) the doctor is blocked: holidays, leave, manual blocks. */
  holidays: string[];
  blockedDates: BlockedDate[];
}

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialtyName?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  notes?: string;
  doctorNotes?: string;
  /** Patient-reported symptom summary from the AI assistant — never a diagnosis. */
  aiSummary?: string;
  meetingUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  patientName: string;
  doctorId?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AiChatMessage {
  id: string;
  sender: "PATIENT" | "AI";
  content: string;
  createdAt: string;
}

export interface AiConversationSummary {
  id: string;
  patientId?: string;
  patientName?: string;
  urgency: UrgencyLevel;
  specialtyLabel?: string;
  summary?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: AiChatMessage[];
}

export type NotificationType =
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_CANCELLED"
  | "DOCTOR_AVAILABILITY"
  | "GENERAL";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type DocumentCategory = "report" | "prescription" | "dental_record" | "other";

export interface MedicalDocumentItem {
  id: string;
  fileName: string;
  category: DocumentCategory;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  patientId?: string;
  patientName?: string;
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface PaymentItem {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
  appointmentDate?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface MedicalProfile {
  allergies: string[];
  currentMedications: string[];
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  appointmentCount: number;
  lastVisit?: string;
  createdAt: string;
}
