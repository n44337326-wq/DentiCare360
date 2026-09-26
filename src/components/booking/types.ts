import type { Role, Service, Specialty } from "@/types";

/** The slice of a Doctor the booking flow needs, plus their next open slot. Plain and serializable. */
export interface BookingDoctor {
  id: string;
  name: string;
  photoUrl?: string;
  specialtySlug: string;
  specialtyName: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  location: string;
  supportsOnline: boolean;
  supportsInPerson: boolean;
  isTemporarilyUnavailable: boolean;
  unavailableReason?: string;
  autoConfirm: boolean;
  nextAvailable: { date: string; startTime: string } | null;
}

export interface BookingCatalog {
  services: Service[];
  specialties: Specialty[];
  doctors: BookingDoctor[];
}

export interface BookingUser {
  role: Role;
  name?: string | null;
}

/** Selections resolved (and validated against the catalog) from the page's query string. */
export interface BookingInitial {
  serviceId: string | null;
  specialtySlug: string | null;
  doctorId: string | null;
  date: string | null;
  startTime: string | null;
  conversationId: string | null;
  slotWarning: string | null;
}

export const EMPTY_INITIAL: BookingInitial = {
  serviceId: null,
  specialtySlug: null,
  doctorId: null,
  date: null,
  startTime: null,
  conversationId: null,
  slotWarning: null,
};
