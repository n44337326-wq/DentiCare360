import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { getSessionUser } from "@/lib/guards";
import { countUnread } from "@/services/notifications";
import { Button } from "@/components/ui/button";
import { PortalNav } from "@/components/patient/portal-nav";

export const dynamic = "force-dynamic";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect("/login");

  // A failing count must never take the whole portal down.
  const unread = await countUnread(user.id).catch(() => 0);

  return (
    <div className="container-app grid grid-cols-[minmax(0,1fr)] gap-6 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-10 print:block print:max-w-none print:p-0">
      <aside className="space-y-4 print:hidden lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center justify-between gap-3 lg:block">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Patient portal</p>
            <p className="truncate text-sm font-semibold text-navy">{user.name ?? "Your account"}</p>
          </div>
          <Button size="sm" asChild className="shrink-0 lg:mt-4 lg:w-full">
            <Link href="/appointments/book">
              <CalendarPlus aria-hidden="true" /> Book appointment
            </Link>
          </Button>
        </div>
        <PortalNav initialUnread={unread} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
