"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clinicNow } from "@/lib/time";
import type { Appointment } from "@/types";
import { joinWindow } from "@/components/patient/appointment-utils";

const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(timer);
}
const getTick = () => Math.floor(Date.now() / TICK_MS);
const getServerTick = () => 0;

/**
 * "Join online consultation" — enabled from 15 minutes before the start until
 * the end of the slot. The clock only runs in the browser (server snapshot = 0),
 * so the first paint never disagrees with the server.
 */
export function JoinConsultationButton({
  appointment,
  size = "default",
  label = "Join online consultation",
}: {
  appointment: Pick<Appointment, "id" | "date" | "startTime" | "endTime">;
  size?: "default" | "sm";
  label?: string;
}) {
  const tick = useSyncExternalStore(subscribe, getTick, getServerTick);

  if (tick === 0) {
    return (
      <Button size={size} variant="outline" disabled>
        <Video aria-hidden="true" /> {label}
      </Button>
    );
  }

  const win = joinWindow(appointment, clinicNow(new Date(tick * TICK_MS)));

  if (win.state === "open") {
    return (
      <Button size={size} asChild>
        <Link href={`/consultation/${appointment.id}`}>
          <Video aria-hidden="true" /> {label}
        </Link>
      </Button>
    );
  }

  if (win.state === "ended") {
    return (
      <Button size={size} variant="outline" disabled>
        <Video aria-hidden="true" /> Session ended
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button size={size} variant="outline" disabled aria-describedby={`join-hint-${appointment.id}`}>
        <Video aria-hidden="true" /> {label === "Join online consultation" ? "Join" : label}
      </Button>
      <span id={`join-hint-${appointment.id}`} className="text-xs text-muted">
        Opens 15 min before
      </span>
    </div>
  );
}
