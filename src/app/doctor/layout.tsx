import { PortalShell } from "@/components/doctor/portal-shell";
import type { PortalNavItem } from "@/components/doctor/portal-nav";
import { countUnread } from "@/services/notifications";
import { requireDoctorUser } from "@/app/doctor/_guard";

const NAV: PortalNavItem[] = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/doctor/appointments", label: "Appointments", icon: "appointments" },
  { href: "/doctor/availability", label: "Availability", icon: "availability" },
  { href: "/doctor/notifications", label: "Notifications", icon: "notifications" },
];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDoctorUser();
  const unread = await countUnread(user.id).catch(() => 0);

  return (
    <PortalShell
      title="Doctor Portal"
      navLabel="Doctor portal"
      items={NAV}
      unreadHref="/doctor/notifications"
      unread={unread}
    >
      {children}
    </PortalShell>
  );
}
