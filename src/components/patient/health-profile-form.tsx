"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { apiFetch, fieldError } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { medicalProfileSchema } from "@/lib/validation";
import type { MedicalProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/shared/states";
import { TagListField } from "@/components/patient/tag-list-field";

const MAX_HISTORY = 4000;
type FieldErrors = Partial<Record<keyof MedicalProfile, string>>;

const sameProfile = (a: MedicalProfile, b: MedicalProfile) => JSON.stringify(a) === JSON.stringify(b);

export function HealthProfileForm({
  initial,
  name,
  email,
}: {
  initial: MedicalProfile;
  name: string;
  email: string;
}) {
  const [saved, setSaved] = useState<MedicalProfile>(initial);
  const [values, setValues] = useState<MedicalProfile>(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { run, pending, error, rawError, reset } = useAsyncAction(async (profile: MedicalProfile) => {
    await apiFetch("/api/medical-profile", { method: "PUT", json: profile });
    return true;
  });

  const dirty = !sameProfile(values, saved);
  const err = (field: keyof MedicalProfile) => clientErrors[field] ?? fieldError(rawError, field);

  function update<K extends keyof MedicalProfile>(key: K, value: MedicalProfile[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setShowSuccess(false);
    if (error) reset();
    if (clientErrors[key]) setClientErrors((c) => ({ ...c, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuccess(false);

    const parsed = medicalProfileSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MedicalProfile | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setClientErrors(next);
      return;
    }
    setClientErrors({});

    const ok = await run(parsed.data);
    if (ok) {
      setSaved(parsed.data);
      setValues(parsed.data);
      setShowSuccess(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
          <CardDescription>From your account. Contact support to change these details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="hp-name">Full name</Label>
            <Input id="hp-name" value={name} readOnly className="mt-1.5 bg-soft-blue/50" />
          </div>
          <div>
            <Label htmlFor="hp-email">Email</Label>
            <Input id="hp-email" value={email} readOnly className="mt-1.5 bg-soft-blue/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allergies &amp; medications</CardTitle>
          <CardDescription>Helps your clinicians avoid unsafe treatments. Press Enter to add each item.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TagListField
            id="hp-allergies"
            label="Allergies"
            placeholder="e.g. Penicillin, latex"
            values={values.allergies}
            onChange={(v) => update("allergies", v)}
            maxItems={30}
            maxLength={100}
            error={err("allergies")}
            disabled={pending}
          />
          <TagListField
            id="hp-medications"
            label="Medications you take (entered by you)"
            hint="Include the dose if you know it. This list is self-reported and not verified by the clinic."
            placeholder="e.g. Metformin 500 mg"
            values={values.currentMedications}
            onChange={(v) => update("currentMedications", v)}
            maxItems={30}
            maxLength={150}
            error={err("currentMedications")}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical history</CardTitle>
          <CardDescription>Past conditions, surgeries or anything else your doctor should know.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="hp-history">Medical history</Label>
          <Textarea
            id="hp-history"
            value={values.medicalHistory}
            maxLength={MAX_HISTORY}
            rows={6}
            disabled={pending}
            className="mt-1.5"
            aria-invalid={err("medicalHistory") ? true : undefined}
            aria-describedby="hp-history-msg"
            onChange={(e) => update("medicalHistory", e.target.value)}
          />
          <p id="hp-history-msg" className="mt-1 flex justify-between gap-3 text-xs">
            <span role={err("medicalHistory") ? "alert" : undefined} className="text-red-700">
              {err("medicalHistory")}
            </span>
            <span className="text-muted">
              {values.medicalHistory.length}/{MAX_HISTORY}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency contact</CardTitle>
          <CardDescription>Someone we can reach if there is a problem during a visit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="hp-ec-name">Contact name</Label>
            <Input
              id="hp-ec-name"
              value={values.emergencyContactName}
              maxLength={100}
              disabled={pending}
              autoComplete="off"
              className="mt-1.5"
              aria-invalid={err("emergencyContactName") ? true : undefined}
              aria-describedby={err("emergencyContactName") ? "hp-ec-name-err" : undefined}
              onChange={(e) => update("emergencyContactName", e.target.value)}
            />
            {err("emergencyContactName") && (
              <p id="hp-ec-name-err" role="alert" className="mt-1 text-xs text-red-700">
                {err("emergencyContactName")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="hp-ec-phone">Contact phone</Label>
            <Input
              id="hp-ec-phone"
              type="tel"
              value={values.emergencyContactPhone}
              maxLength={20}
              disabled={pending}
              autoComplete="off"
              className="mt-1.5"
              aria-invalid={err("emergencyContactPhone") ? true : undefined}
              aria-describedby={err("emergencyContactPhone") ? "hp-ec-phone-err" : undefined}
              onChange={(e) => update("emergencyContactPhone", e.target.value)}
            />
            {err("emergencyContactPhone") && (
              <p id="hp-ec-phone-err" role="alert" className="mt-1 text-xs text-red-700">
                {err("emergencyContactPhone")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <InlineAlert variant="error" title="Couldn't save your profile">{error}</InlineAlert>}
      {showSuccess && <InlineAlert variant="success" title="Health profile saved" />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          Only you and clinicians treating you can see this.
        </p>
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
