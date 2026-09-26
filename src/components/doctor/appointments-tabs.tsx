"use client";

import type { Appointment } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentList } from "@/components/doctor/appointment-list";

interface Buckets {
  today: Appointment[];
  upcoming: Appointment[];
  requests: Appointment[];
  past: Appointment[];
}

/** Doctor appointments split into Today / Upcoming / Requests / Past. Buckets are computed on the server in clinic time. */
export function AppointmentsTabs({ buckets }: { buckets: Buckets }) {
  const initial = buckets.today.length ? "today" : buckets.requests.length ? "requests" : "upcoming";
  const tabs = [
    { value: "today", label: "Today", items: buckets.today, empty: "No appointments today", hint: "Enjoy the quiet — new bookings will appear here.", help: "Everything scheduled for today. Mark visits completed or no-show once they've happened, and add notes for your records." },
    { value: "upcoming", label: "Upcoming", items: buckets.upcoming, empty: "No upcoming appointments", hint: "Booked appointments after today will appear here.", help: "Confirmed appointments from tomorrow onwards. You can reschedule or cancel — the patient is notified automatically." },
    { value: "requests", label: "Requests", items: buckets.requests, empty: "No pending requests", hint: "When auto-confirm is off, new bookings wait here for you to accept.", help: "New booking requests waiting for your decision. The time slot is held for the patient until you accept, reschedule or cancel." },
    { value: "past", label: "Past", items: buckets.past, empty: "No past appointments yet", hint: "Completed, cancelled and earlier visits are kept here.", help: "Completed, cancelled and earlier visits. Open a patient to review their history, or edit your notes." },
  ];

  return (
    <Tabs defaultValue={initial}>
      <TabsList className="flex w-full max-w-full overflow-x-auto sm:w-auto sm:inline-flex">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1 whitespace-nowrap sm:flex-none">
            {t.label}
            <span className="ml-1.5 rounded-full bg-white/70 px-1.5 text-xs text-navy">{t.items.length}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          <p className="mb-3 text-sm text-navy/75">{t.help}</p>
          <AppointmentList
            appointments={t.items}
            role="DOCTOR"
            linkPatient
            highlightPending={t.value === "requests"}
            emptyTitle={t.empty}
            emptyDescription={t.hint}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
