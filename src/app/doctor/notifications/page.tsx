import { NotificationsList } from "@/components/shared/notifications-list";
import { PageHeader } from "@/components/doctor/page-header";
import { requireDoctorUser } from "@/app/doctor/_guard";

export const metadata = { title: "Notifications — Doctor Portal" };
export const dynamic = "force-dynamic";

export default async function DoctorNotificationsPage() {
  await requireDoctorUser();
  return (
    <div>
      <PageHeader title="Notifications" description="New bookings, cancellations and schedule changes." />
      <NotificationsList />
    </div>
  );
}
