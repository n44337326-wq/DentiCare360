"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, ServiceCategory, Specialty } from "@/types";
import { apiFetch, fieldError } from "@/lib/api-client";
import { serviceInputSchema } from "@/lib/validation";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { ToggleSwitch } from "@/components/doctor/toggle-switch";
import { Field, invalidClass } from "@/components/admin/form-field";

const CATEGORIES: ServiceCategory[] = ["Dental", "Skin & Dermatology", "General Health"];

interface FormState {
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: string;
  startingPrice: string;
  specialtySlug: string;
  suitableSpecialist: string;
  isActive: boolean;
}

function initialState(service: Service | null, specialties: Specialty[]): FormState {
  return service
    ? {
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: String(service.durationMinutes),
        startingPrice: String(service.startingPrice),
        specialtySlug: service.specialtySlug,
        suitableSpecialist: service.suitableSpecialist,
        isActive: service.isActive,
      }
    : {
        name: "",
        category: "Dental",
        description: "",
        durationMinutes: "30",
        startingPrice: "0",
        specialtySlug: specialties[0]?.slug ?? "",
        suitableSpecialist: "",
        isActive: true,
      };
}

/** Add (service = null) or edit a service. Mount it only while open so state resets each time. */
export function ServiceDialog({
  service,
  specialties,
  onClose,
}: {
  service: Service | null;
  specialties: Specialty[];
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = !!service;
  const [form, setForm] = useState(() => initialState(service, specialties));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const send = useCallback(
    (body: unknown) =>
      editing
        ? apiFetch(`/api/admin/services/${service!.id}`, { method: "PATCH", json: body })
        : apiFetch("/api/admin/services", { method: "POST", json: body }),
    [editing, service]
  );
  const { run, pending, error, rawError } = useAsyncAction(send);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      durationMinutes: Number(form.durationMinutes),
      startingPrice: Number(form.startingPrice),
      specialtySlug: form.specialtySlug,
      suitableSpecialist: form.suitableSpecialist,
      isActive: form.isActive,
    };
    const parsed = serviceInputSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    if (await run(payload)) {
      onClose();
      router.refresh();
    }
  }

  const err = (k: string) => errors[k] ?? fieldError(rawError, k);
  const ctl = (k: string) => ({ "aria-invalid": !!err(k), "aria-describedby": err(k) ? `svc-${k}-err` : undefined, className: invalidClass(err(k)) });

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={editing ? "Edit service" : "Add service"}
      description={editing ? `Update “${service!.name}”. Existing appointments keep their booked service.` : "Add a service patients can book."}
      submitLabel={editing ? "Save changes" : "Add service"}
      pendingLabel="Saving…"
      pending={pending}
      error={error}
      onSubmit={submit}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="svc-name" label="Name" error={err("name")} className="sm:col-span-2">
          <Input id="svc-name" value={form.name} onChange={(e) => set("name", e.target.value)} {...ctl("name")} />
        </Field>
        <Field id="svc-category" label="Category" error={err("category")}>
          <Select value={form.category} onValueChange={(v) => set("category", v as ServiceCategory)}>
            <SelectTrigger id="svc-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="svc-specialty" label="Specialty" error={err("specialtySlug")}>
          <Select value={form.specialtySlug} onValueChange={(v) => set("specialtySlug", v)}>
            <SelectTrigger id="svc-specialty"><SelectValue placeholder="Choose a specialty" /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="svc-description" label="Description" error={err("description")} className="sm:col-span-2">
          <Textarea id="svc-description" rows={3} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} {...ctl("description")} />
        </Field>
        <Field id="svc-durationMinutes" label="Duration (minutes)" error={err("durationMinutes")}>
          <Input id="svc-durationMinutes" type="number" min={5} max={480} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} {...ctl("durationMinutes")} />
        </Field>
        <Field id="svc-startingPrice" label="Starting price (USD)" error={err("startingPrice")}>
          <Input id="svc-startingPrice" type="number" min={0} step="0.01" value={form.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} {...ctl("startingPrice")} />
        </Field>
        <Field id="svc-suitableSpecialist" label="Suitable specialist" error={err("suitableSpecialist")} hint="Shown to patients, e.g. “General dentist”." className="sm:col-span-2">
          <Input id="svc-suitableSpecialist" value={form.suitableSpecialist} onChange={(e) => set("suitableSpecialist", e.target.value)} {...ctl("suitableSpecialist")} />
        </Field>
        <ToggleSwitch
          className="sm:col-span-2"
          checked={form.isActive}
          onCheckedChange={(v) => set("isActive", v)}
          label="Active"
          description="Inactive services are hidden from patients and cannot be booked."
        />
      </div>
    </ActionDialog>
  );
}
