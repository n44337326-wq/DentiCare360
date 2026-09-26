import type { Service, Specialty } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { ServicesTable } from "@/components/admin/services-table";
import { PageHeader } from "@/components/doctor/page-header";
import { listServices, listSpecialties } from "@/services/catalog";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Services — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireAdminUser();

  let data: { services: Service[]; specialties: Specialty[] } | null = null;
  try {
    const [services, specialties] = await Promise.all([listServices({ includeInactive: true }), listSpecialties()]);
    data = { services, specialties };
  } catch (err) {
    console.error("[admin/services] failed to load", err);
  }

  return (
    <div>
      <PageHeader title="Services" description="The catalogue patients book from. Deactivate a service to hide it without losing its history." />
      {data ? (
        <ServicesTable services={data.services} specialties={data.specialties} />
      ) : (
        <ErrorState message="We couldn't load the services. Please refresh the page to try again." />
      )}
    </div>
  );
}
