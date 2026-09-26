import { clinicToday } from "@/lib/time";
import type { Doctor } from "@/types";
import { listDoctors, listServices, listSpecialties } from "@/services/catalog";
import { getDoctorSlots, getNextAvailableForDoctors } from "@/services/scheduling";
import { resolvePreselection, type RawQuery } from "@/components/booking/preselect";
import type { BookingCatalog, BookingDoctor, BookingInitial } from "@/components/booking/types";

export type BookingData = { ok: true; catalog: BookingCatalog; initial: BookingInitial } | { ok: false };

const toBookingDoctor = (d: Doctor, next: Awaited<ReturnType<typeof getNextAvailableForDoctors>>): BookingDoctor => {
  const n = next.get(d.id);
  return {
    id: d.id,
    name: d.name,
    photoUrl: d.photoUrl,
    specialtySlug: d.specialtySlug,
    specialtyName: d.specialtyName,
    experienceYears: d.experienceYears,
    rating: d.rating,
    reviewCount: d.reviewCount,
    consultationFee: d.consultationFee,
    location: d.location,
    supportsOnline: d.supportsOnline,
    supportsInPerson: d.supportsInPerson,
    isTemporarilyUnavailable: d.isTemporarilyUnavailable,
    unavailableReason: d.unavailableReason,
    autoConfirm: d.autoConfirm,
    nextAvailable: n ? { date: n.date, startTime: n.slot.startTime } : null,
  };
};

/** Server-side loader for the booking page: catalog + query preselection (checked against live availability). */
export async function loadBookingData(query: RawQuery): Promise<BookingData> {
  try {
    const [services, specialties, doctors] = await Promise.all([listServices(), listSpecialties(), listDoctors()]);
    const next = await getNextAvailableForDoctors(doctors);
    const catalog: BookingCatalog = { services, specialties, doctors: doctors.map((d) => toBookingDoctor(d, next)) };

    const initial = resolvePreselection(query, catalog, clinicToday());

    // A deep-linked slot (e.g. from the AI assistant) may have been taken since the link was made.
    if (initial.doctorId && initial.date && initial.startTime) {
      const doctor = doctors.find((d) => d.id === initial.doctorId);
      try {
        const day = doctor ? await getDoctorSlots(doctor, initial.date) : null;
        const open = day?.slots.some((s) => s.startTime === initial.startTime && !s.isBooked);
        if (!open) {
          initial.startTime = null;
          initial.slotWarning = "The time from your link is no longer available. Please choose another time.";
        }
      } catch {
        initial.startTime = null;
      }
    }
    return { ok: true, catalog, initial };
  } catch {
    return { ok: false };
  }
}
