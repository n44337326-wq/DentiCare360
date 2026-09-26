import { addDays } from "@/lib/time";
import type { Appointment, ConsultationType, Service } from "@/types";
import type { BookingCatalog, BookingDoctor, BookingInitial } from "@/components/booking/types";
import { STEP, STEP_COUNT } from "@/components/booking/steps";

export interface BookingState {
  step: number;
  serviceId: string | null;
  specialtySlug: string | null;
  doctorId: string | null;
  date: string | null;
  startTime: string | null;
  consultationType: ConsultationType | null;
  /** null until the patient edits it; the session name is used until then. */
  patientName: string | null;
  notes: string;
  conversationId: string | null;
  slotWarning: string | null;
  /** Bumped to force availability widgets to refetch. */
  refreshKey: number;
  confirmed: Appointment | null;
}

export type BookingAction =
  | { type: "service"; service: Service }
  | { type: "specialty"; slug: string }
  | { type: "doctor"; doctor: BookingDoctor; today: string }
  | { type: "date"; date: string }
  | { type: "slot"; date: string; startTime: string }
  | { type: "consultation"; value: ConsultationType }
  | { type: "name"; value: string }
  | { type: "notes"; value: string }
  | { type: "goto"; step: number }
  | { type: "slotTaken"; message: string }
  | { type: "dismissWarning" }
  | { type: "confirmed"; appointment: Appointment }
  | { type: "reset"; conversationId: string | null };

// ---------------------------------------------------------------- derived data

export interface BookingDerived {
  service: Service | null;
  doctor: BookingDoctor | null;
  specialtyName: string | null;
  patientName: string;
  /** valid[n] = is step n complete (index 0 unused). */
  valid: boolean[];
  /** The furthest step the patient may jump to. */
  reachable: number;
}

export function supportedTypes(doctor: BookingDoctor | null): ConsultationType[] {
  if (!doctor) return [];
  const types: ConsultationType[] = [];
  if (doctor.supportsInPerson) types.push("IN_PERSON");
  if (doctor.supportsOnline) types.push("ONLINE");
  return types;
}

export function deriveBooking(state: BookingState, catalog: BookingCatalog, defaultName: string): BookingDerived {
  const service = catalog.services.find((s) => s.id === state.serviceId) ?? null;
  const doctor = catalog.doctors.find((d) => d.id === state.doctorId) ?? null;
  const specialty = catalog.specialties.find((s) => s.slug === state.specialtySlug) ?? null;
  const patientName = state.patientName ?? defaultName;

  const valid: boolean[] = new Array(STEP_COUNT + 1).fill(false);
  valid[STEP.service] = !!service;
  valid[STEP.specialty] = !!service && !!specialty && specialty.slug === service.specialtySlug;
  valid[STEP.doctor] = !!doctor && !!service && doctor.specialtySlug === service.specialtySlug && !doctor.isTemporarilyUnavailable;
  valid[STEP.date] = !!state.date;
  valid[STEP.time] = !!state.date && !!state.startTime;
  valid[STEP.details] =
    !!state.consultationType &&
    supportedTypes(doctor).includes(state.consultationType) &&
    patientName.trim().length >= 2 &&
    state.notes.length <= 1000;
  valid[STEP.confirm] = valid.slice(1, STEP.confirm).every(Boolean);

  let reachable = 1;
  while (reachable < STEP_COUNT && valid[reachable]) reachable++;

  return { service, doctor, specialtyName: specialty?.name ?? null, patientName, valid, reachable };
}

// ---------------------------------------------------------------- reducer

export function initBooking(args: { catalog: BookingCatalog; initial: BookingInitial; defaultName: string }): BookingState {
  const { catalog, initial, defaultName } = args;
  const doctor = catalog.doctors.find((d) => d.id === initial.doctorId) ?? null;
  const types = supportedTypes(doctor);
  const base: BookingState = {
    step: 1,
    serviceId: initial.serviceId,
    specialtySlug: initial.specialtySlug,
    doctorId: initial.doctorId,
    date: initial.date,
    startTime: initial.startTime,
    consultationType: types.length === 1 ? types[0] : null,
    patientName: null,
    notes: "",
    conversationId: initial.conversationId,
    slotWarning: initial.slotWarning,
    refreshKey: 0,
    confirmed: null,
  };
  // Land on the first step that still needs an answer.
  const { reachable } = deriveBooking(base, catalog, defaultName);
  return { ...base, step: reachable };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "service": {
      const changed = state.serviceId !== action.service.id;
      const specialtyChanged = state.specialtySlug !== action.service.specialtySlug;
      return {
        ...state,
        serviceId: action.service.id,
        specialtySlug: action.service.specialtySlug,
        // A doctor from another specialty can never be booked for this service.
        ...(specialtyChanged ? { doctorId: null, date: null, startTime: null, consultationType: null } : {}),
        ...(changed ? { slotWarning: null } : {}),
      };
    }
    case "specialty":
      return { ...state, specialtySlug: action.slug };
    case "doctor": {
      if (state.doctorId === action.doctor.id) return state;
      const types = supportedTypes(action.doctor);
      const keepDate = state.date !== null && state.date >= action.today;
      return {
        ...state,
        doctorId: action.doctor.id,
        date: keepDate ? state.date : (action.doctor.nextAvailable?.date ?? addDays(action.today, 1)),
        startTime: null,
        slotWarning: null,
        consultationType: state.consultationType && types.includes(state.consultationType) ? state.consultationType : types.length === 1 ? types[0] : null,
      };
    }
    case "date":
      return { ...state, date: action.date, startTime: null, slotWarning: null };
    case "slot":
      return { ...state, date: action.date, startTime: action.startTime, slotWarning: null };
    case "consultation":
      return { ...state, consultationType: action.value };
    case "name":
      return { ...state, patientName: action.value };
    case "notes":
      return { ...state, notes: action.value.slice(0, 1000) };
    case "goto":
      return { ...state, step: Math.min(Math.max(action.step, 1), STEP_COUNT) };
    case "slotTaken":
      return { ...state, step: STEP.time, startTime: null, slotWarning: action.message, refreshKey: state.refreshKey + 1 };
    case "dismissWarning":
      return { ...state, slotWarning: null };
    case "confirmed":
      return { ...state, confirmed: action.appointment };
    case "reset":
      return {
        step: 1,
        serviceId: null,
        specialtySlug: null,
        doctorId: null,
        date: null,
        startTime: null,
        consultationType: null,
        patientName: null,
        notes: "",
        conversationId: action.conversationId,
        slotWarning: null,
        refreshKey: state.refreshKey + 1,
        confirmed: null,
      };
  }
}
