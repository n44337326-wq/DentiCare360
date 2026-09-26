import { PortalShell } from "@/components/doctor/portal-shell";
import type { PortalNavItem } from "@/components/doctor/portal-nav";
import { countUnread } from "@/services/notifications";
import { requireAdminUser } from "@/app/admin/_guard";

const NAV: PortalNavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
  { href: "/admin/doctors", label: "Doctors", icon: "doctors" },
  { href: "/admin/patients", label: "Patients", icon: "patients" },
  { href: "/admin/services", label: "Services", icon: "services" },
  { href: "/admin/appointments", label: "Appointments", icon: "appointments" },
  { href: "/admin/payments", label: "Payments", icon: "payments" },
  { href: "/admin/ai-conversations", label: "AI Conversations", icon: "ai" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/notifications", label: "Notifications", icon: "notifications" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const unread = await countUnread(user.id).catch(() => 0);

  return (
    <PortalShell
      title="Admin Portal"
      navLabel="Admin portal"
      items={NAV}
      unreadHref="/admin/notifications"
      unread={unread}
    >
      {children}
    </PortalShell>
  );
}
