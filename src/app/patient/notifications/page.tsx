import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { NotificationsList } from "@/components/shared/notifications-list";
import { PageHeader } from "@/components/patient/page-header";

export const metadata = { title: "Notifications — DentiCare360" };
export const dynamic = "force-dynamic";

export default async function PatientNotificationsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect("/login");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Appointment confirmations, reminders and schedule changes from your care team."
      />
      <NotificationsList />
    </div>
  );
}
