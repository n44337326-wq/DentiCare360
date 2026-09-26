"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import type { Specialty } from "@/types";
import { ApiError, apiFetch, fieldError } from "@/lib/api-client";
import { createDoctorSchema } from "@/lib/admin-validation";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/shared/states";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { Field, invalidClass } from "@/components/admin/form-field";

const splitList = (v: string) => v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const EMPTY = {
  name: "", email: "", password: "", specialtySlug: "", title: "", bio: "", qualifications: "", areasOfExpertise: "",
  languages: "English", experienceYears: "0", consultationFee: "100", location: "", supportsOnline: true, supportsInPerson: true,
};

/** "Add doctor": creates the login, the public profile and a default Mon–Fri schedule in one request. */
export function AddDoctorDialog({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<string | null>(null);

  const send = useCallback(async (body: unknown) => apiFetch<{ doctor: { name: string } }>("/api/admin/doctors", { method: "POST", json: body }), []);
  const { run, pending, error, rawError, reset } = useAsyncAction(send);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    reset();
  }

  async function submit() {
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      specialtySlug: form.specialtySlug,
      title: form.title,
      bio: form.bio,
      qualifications: splitList(form.qualifications),
      areasOfExpertise: splitList(form.areasOfExpertise),
      languages: splitList(form.languages),
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
      ...(form.location.trim() ? { location: form.location.trim() } : {}),
      supportsOnline: form.supportsOnline,
      supportsInPerson: form.supportsInPerson,
    };
    const parsed = createDoctorSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      if (!form.specialtySlug) next.specialtySlug = "Choose a specialty.";
      setErrors(next);
      return;
    }
    setErrors({});
    const res = await run(payload);
    if (res) {
      setCreated(res.doctor.name);
      close();
      router.refresh();
    }
  }

  const emailTaken = rawError instanceof ApiError && rawError.code === "EMAIL_TAKEN";
  const err = (k: string) =>
    errors[k] ?? fieldError(rawError, k) ?? (k === "email" && emailTaken ? "An account with this email already exists." : undefined);
  const ctl = (k: string, id = k) => ({ "aria-invalid": !!err(k), "aria-describedby": err(k) ? `add-doc-${id}-err` : undefined, className: invalidClass(err(k)) });

  return (
    <>
      <Button onClick={() => { setCreated(null); setOpen(true); }}>
        <UserPlus aria-hidden="true" /> Add doctor
      </Button>
      {created && (
        <div className="w-full">
          <InlineAlert variant="success" title={`${created} was added`}>
            They now appear in the list with a default Monday–Friday schedule (9:00–17:00, break 13:00–14:00). Share the initial password with them securely.
          </InlineAlert>
        </div>
      )}
      {open && (
        <ActionDialog
          open
          onOpenChange={(o) => !o && close()}
          title="Add doctor"
          description="Creates a doctor login and public profile. Choose a temporary password and share it with the doctor securely."
          submitLabel="Create doctor"
          pendingLabel="Creating…"
          pending={pending}
          error={emailTaken ? null : error}
          onSubmit={submit}
          wide
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="add-doc-name" label="Full name" error={err("name")}>
              <Input id="add-doc-name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" {...ctl("name")} />
            </Field>
            <Field id="add-doc-email" label="Email (login)" error={err("email")}>
              <Input id="add-doc-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" {...ctl("email")} />
            </Field>
            <Field id="add-doc-password" label="Initial password" error={err("password")} hint="At least 8 characters with a letter and a number.">
              <Input id="add-doc-password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" {...ctl("password")} />
            </Field>
            <Field id="add-doc-specialty" label="Specialty" error={err("specialtySlug")}>
              <Select value={form.specialtySlug} onValueChange={(v) => set("specialtySlug", v)}>
                <SelectTrigger id="add-doc-specialty" aria-invalid={!!err("specialtySlug")}>
                  <SelectValue placeholder="Choose a specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="add-doc-title" label="Focus / title" error={err("title")} hint="e.g. Orthodontics">
              <Input id="add-doc-title" value={form.title} onChange={(e) => set("title", e.target.value)} {...ctl("title")} />
            </Field>
            <Field id="add-doc-location" label="Location (optional)" error={err("location")}>
              <Input id="add-doc-location" value={form.location} onChange={(e) => set("location", e.target.value)} {...ctl("location")} />
            </Field>
            <Field id="add-doc-years" label="Years of experience" error={err("experienceYears")}>
              <Input id="add-doc-years" type="number" min={0} max={70} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} {...ctl("experienceYears", "years")} />
            </Field>
            <Field id="add-doc-fee" label="Consultation fee (USD)" error={err("consultationFee")}>
              <Input id="add-doc-fee" type="number" min={0} max={10000} step="0.01" value={form.consultationFee} onChange={(e) => set("consultationFee", e.target.value)} {...ctl("consultationFee", "fee")} />
            </Field>
            <Field id="add-doc-bio" label="Bio" error={err("bio")} className="sm:col-span-2">
              <Textarea id="add-doc-bio" rows={3} maxLength={2000} value={form.bio} onChange={(e) => set("bio", e.target.value)} {...ctl("bio")} />
            </Field>
            <Field id="add-doc-quals" label="Qualifications" error={err("qualifications")} hint="Separate with commas.">
              <Input id="add-doc-quals" value={form.qualifications} onChange={(e) => set("qualifications", e.target.value)} {...ctl("qualifications", "quals")} />
            </Field>
            <Field id="add-doc-expertise" label="Areas of expertise" error={err("areasOfExpertise")} hint="Separate with commas.">
              <Input id="add-doc-expertise" value={form.areasOfExpertise} onChange={(e) => set("areasOfExpertise", e.target.value)} {...ctl("areasOfExpertise", "expertise")} />
            </Field>
            <Field id="add-doc-languages" label="Languages" error={err("languages")} hint="Separate with commas.">
              <Input id="add-doc-languages" value={form.languages} onChange={(e) => set("languages", e.target.value)} {...ctl("languages")} />
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-navy">Consultation types</legend>
              <div className="flex items-center gap-2">
                <Checkbox id="add-doc-inperson" checked={form.supportsInPerson} onCheckedChange={(v) => set("supportsInPerson", v === true)} />
                <Label htmlFor="add-doc-inperson" className="font-normal">In person</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="add-doc-online" checked={form.supportsOnline} onCheckedChange={(v) => set("supportsOnline", v === true)} />
                <Label htmlFor="add-doc-online" className="font-normal">Online</Label>
              </div>
              {err("supportsInPerson") && <p role="alert" className="text-xs text-red-700">{err("supportsInPerson")}</p>}
            </fieldset>
          </div>
        </ActionDialog>
      )}
    </>
  );
}
