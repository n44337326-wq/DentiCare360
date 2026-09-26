import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { getMedicalProfile } from "@/services/users";
import { ErrorState } from "@/components/shared/states";
import { HealthProfileForm } from "@/components/patient/health-profile-form";
import { loadSafe } from "@/components/patient/load-safe";
import { PageHeader } from "@/components/patient/page-header";

export const metadata = { title: "Health profile — DentiCare360" };
export const dynamic = "force-dynamic";

export default async function HealthProfilePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT" || !user.patientId) redirect("/login");
  const patientId = user.patientId;

  const profile = await loadSafe("health profile", () => getMedicalProfile(patientId));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Health profile"
        description="Keep your health information up to date so your care team has the full picture. Only you and clinicians treating you can see this."
      />
      {profile.ok ? (
        <HealthProfileForm initial={profile.data} name={user.name ?? ""} email={user.email ?? ""} />
      ) : (
        <ErrorState message={profile.message} />
      )}
    </div>
  );
}
