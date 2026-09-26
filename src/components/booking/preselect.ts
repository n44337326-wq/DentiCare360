import { isValidISODate, isValidTime } from "@/lib/time";
import type { BookingCatalog, BookingInitial } from "@/components/booking/types";
import { EMPTY_INITIAL } from "@/components/booking/types";

export type RawQuery = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed.slice(0, 200) : undefined;
};

/**
 * Turns the untrusted query string into a consistent set of selections. Every
 * value is checked against the loaded catalog (unknown ones are ignored) and a
 * doctor/service pair from different specialties is never produced, because
 * the booking API rejects it.
 */
export function resolvePreselection(query: RawQuery, catalog: BookingCatalog, today: string): BookingInitial {
  const result: BookingInitial = { ...EMPTY_INITIAL };

  const service = catalog.services.find((s) => s.slug === first(query.service));
  const doctorQ = catalog.doctors.find((d) => d.id === first(query.doctor) && !d.isTemporarilyUnavailable);
  const specialtyQ = catalog.specialties.find((s) => s.slug === first(query.specialty));

  if (service) {
    result.serviceId = service.id;
    result.specialtySlug = service.specialtySlug;
  }

  // The service wins over a doctor from a different specialty.
  if (doctorQ && (!service || service.specialtySlug === doctorQ.specialtySlug)) {
    result.doctorId = doctorQ.id;
    result.specialtySlug = doctorQ.specialtySlug;
  }

  if (!result.specialtySlug && specialtyQ) result.specialtySlug = specialtyQ.slug;

  // Back-fill the service when its specialty only offers one.
  if (!result.serviceId && result.specialtySlug) {
    const options = catalog.services.filter((s) => s.specialtySlug === result.specialtySlug);
    if (options.length === 1) result.serviceId = options[0].id;
  }

  const date = first(query.date);
  if (result.doctorId && date && isValidISODate(date) && date >= today) {
    result.date = date;
    const time = first(query.time);
    if (time && isValidTime(time)) result.startTime = time;
  }

  const conversation = first(query.conversation);
  if (conversation && /^[\w-]{1,64}$/.test(conversation)) result.conversationId = conversation;

  return result;
}
