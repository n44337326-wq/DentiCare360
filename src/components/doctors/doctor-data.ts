import type { NextAvailable } from "@/lib/availability";
import { getNextAvailableForDoctors } from "@/services/scheduling";
import { listDoctors } from "@/services/catalog";
import type { Doctor } from "@/types";

export interface DoctorsWithAvailability {
  doctors: Doctor[];
  next: Map<string, NextAvailable | null>;
}

/** Active doctors (best rated first) plus each one's next open slot, using a single slots query. */
export async function loadDoctorsWithAvailability(): Promise<DoctorsWithAvailability> {
  const doctors = await listDoctors();
  const next = await getNextAvailableForDoctors(doctors);
  return { doctors, next };
}
