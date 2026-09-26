"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleSwitch } from "@/components/doctor/toggle-switch";

/** Which consultation types are offered, and whether new bookings are confirmed automatically. */
export function ConsultationSettings({
  supportsOnline,
  supportsInPerson,
  autoConfirm,
  onChange,
  error,
}: {
  supportsOnline: boolean;
  supportsInPerson: boolean;
  autoConfirm: boolean;
  onChange: (patch: { supportsOnline?: boolean; supportsInPerson?: boolean; autoConfirm?: boolean }) => void;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Consultations and booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ToggleSwitch
          checked={supportsInPerson}
          onCheckedChange={(v) => onChange({ supportsInPerson: v })}
          label="In-person visits"
          description="Patients can book a visit at the clinic."
        />
        <ToggleSwitch
          checked={supportsOnline}
          onCheckedChange={(v) => onChange({ supportsOnline: v })}
          label="Online consultations"
          description="Patients can book a video consultation."
        />
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
        <hr className="border-border" />
        <ToggleSwitch
          checked={autoConfirm}
          onCheckedChange={(v) => onChange({ autoConfirm: v })}
          label="Auto-confirm new bookings"
          description={
            autoConfirm
              ? "New bookings are confirmed immediately."
              : "New bookings arrive as requests. You must accept each one before it is confirmed."
          }
        />
      </CardContent>
    </Card>
  );
}
