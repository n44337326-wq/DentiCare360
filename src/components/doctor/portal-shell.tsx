import { PortalNav, type PortalNavItem } from "@/components/doctor/portal-nav";

/** Responsive shell shared by the doctor and admin portals: sidebar on desktop, scrollable nav bar on mobile. */
export function PortalShell({
  title,
  navLabel,
  items,
  unreadHref,
  unread,
  children,
}: {
  title: string;
  navLabel: string;
  items: PortalNavItem[];
  unreadHref?: string;
  unread?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="container-app grid grid-cols-[minmax(0,1fr)] gap-6 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        <PortalNav items={items} label={navLabel} unreadHref={unreadHref} initialUnread={unread} />
      </aside>
      <div className="min-w-0 animate-fade-in">{children}</div>
    </div>
  );
}
