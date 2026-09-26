import { z } from "zod";
import { apiHandler, json, parseWith } from "@/lib/http";
import { NotFoundError } from "@/lib/errors";
import { isoDate } from "@/lib/validation";
import { getActiveDoctor } from "@/services/catalog";
import { getDoctorCalendar, getDoctorSlots } from "@/services/scheduling";

const query = z.object({ doctorId: z.string().min(1).max(64), date: isoDate.optional() });

/**
 * Public availability lookup. With `date`: the day's slots, plus — when the
 * doctor is unavailable — the reason and the next dates that do have room.
 * Without `date`: a 3-week calendar and the doctor's next available slot.
 */
export const GET = apiHandler(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { doctorId, date } = parseWith(query, params);

  const doctor = await getActiveDoctor(doctorId);
  if (!doctor) throw new NotFoundError("Doctor not found.");

  if (date) return json(await getDoctorSlots(doctor, date));
  return json(await getDoctorCalendar(doctor, 21));
});
