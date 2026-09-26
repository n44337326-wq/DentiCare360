import { BookingWizard } from "@/components/booking/booking-wizard";
import { BookingLoadError } from "@/components/booking/load-error";
import { loadBookingData } from "@/components/booking/load-booking-data";
import type { RawQuery } from "@/components/booking/preselect";
import { getSessionUser } from "@/lib/guards";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Book an Appointment — DentiCare360",
  description: "Choose a service, doctor and time, and book your appointment in a few simple steps.",
};

export default async function BookAppointmentPage({ searchParams }: { searchParams: Promise<RawQuery> }) {
  const [query, user] = await Promise.all([searchParams, getSessionUser()]);
  const data = await loadBookingData(query);

  return (
    <div className="container-app py-8 sm:py-12">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Book an appointment</h1>
        <p className="mt-3 text-slate-600">Seven simple steps — you can go back and change anything before you confirm.</p>
      </div>
      {data.ok ? (
        <BookingWizard catalog={data.catalog} initial={data.initial} user={user ? { role: user.role, name: user.name } : null} />
      ) : (
        <div className="mx-auto max-w-xl">
          <BookingLoadError />
        </div>
      )}
    </div>
  );
}
