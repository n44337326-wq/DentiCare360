"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineAlert } from "@/components/shared/states";
import { ToggleSwitch } from "@/components/doctor/toggle-switch";

/** Pauses all new bookings without editing the weekly schedule. */
export function TemporaryUnavailability({
  value,
  reason,
  onChange,
  error,
  idPrefix,
}: {
  value: boolean;
  reason: string;
  onChange: (patch: { isTemporarilyUnavailable?: boolean; unavailableReason?: string }) => void;
  error?: string;
  idPrefix: string;
}) {
  return (
    <Card className={value ? "border-amber-300" : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Temporary unavailability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleSwitch
          checked={value}
          onCheckedChange={(v) => onChange({ isTemporarilyUnavailable: v })}
          label="Pause new bookings"
          description="Patients cannot book any time slot while this is on. Your weekly hours stay as they are."
        />
        {value && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-reason`}>Reason shown to patients (optional)</Label>
              <Input
                id={`${idPrefix}-reason`}
                value={reason}
                maxLength={200}
                onChange={(e) => onChange({ unavailableReason: e.target.value })}
                placeholder="e.g. Away until Monday"
                aria-invalid={!!error}
              />
              {error && (
                <p role="alert" className="text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
            <InlineAlert variant="warning">
              Patients with upcoming appointments will be notified when you save, so they can ask to reschedule.
            </InlineAlert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
