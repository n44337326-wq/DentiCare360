"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, CalendarX2, History } from "lucide-react";
import type { PaymentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, InlineAlert } from "@/components/shared/states";
import { AppointmentCard } from "@/components/patient/appointment-card";
import type { AppointmentGroups, AppointmentView } from "@/components/patient/appointment-utils";

type TabKey = "upcoming" | "past" | "cancelled";

const EMPTY: Record<TabKey, { icon: React.ComponentType<{ className?: string }>; title: string; description: string; cta?: boolean }> = {
  upcoming: {
    icon: CalendarCheck2,
    title: "No upcoming appointments",
    description: "When you book a visit it will show up here, with options to reschedule or join online.",
    cta: true,
  },
  past: { icon: History, title: "No past appointments yet", description: "Completed visits and their doctor notes will be listed here." },
  cancelled: { icon: CalendarX2, title: "No cancelled appointments", description: "Appointments you cancel will be kept here for reference." },
};

export function AppointmentList({
  groups,
  payments,
}: {
  groups: AppointmentGroups;
  /** appointmentId → payment status */
  payments: Record<string, PaymentStatus>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [success, setSuccess] = useState<string | null>(null);

  function handleSuccess(message: string) {
    setSuccess(message);
    router.refresh();
  }

  const tabs: { key: TabKey; label: string; items: AppointmentView[] }[] = [
    { key: "upcoming", label: "Upcoming", items: groups.upcoming },
    { key: "past", label: "Past", items: groups.past },
    { key: "cancelled", label: "Cancelled", items: groups.cancelled },
  ];
  const TAB_HELP: Record<TabKey, string> = {
    upcoming: "Appointments that are still ahead of you. You can reschedule or cancel these, and join online visits from 15 minutes before they start.",
    past: "Visits you've already had, with your doctor's notes. Use 'Book again' for a follow-up with the same doctor.",
    cancelled: "Appointments that were cancelled. Their time slots were released, and any fee you'd paid is refunded.",
  };

  return (
    <div className="space-y-4">
      {success && (
        <InlineAlert variant="success" title="Done">
          {success}
        </InlineAlert>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label} ({t.items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <p className="mb-3 text-sm text-navy/75">{TAB_HELP[t.key]}</p>
            {t.items.length === 0 ? (
              <EmptyState
                icon={EMPTY[t.key].icon}
                title={EMPTY[t.key].title}
                description={EMPTY[t.key].description}
                action={
                  EMPTY[t.key].cta ? (
                    <Button asChild>
                      <Link href="/appointments/book">Book an appointment</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-3">
                {t.items.map((view) => (
                  <li key={view.appointment.id}>
                    <AppointmentCard
                      view={view}
                      paymentStatus={payments[view.appointment.id]}
                      isPast={t.key === "past"}
                      onSuccess={handleSuccess}
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
