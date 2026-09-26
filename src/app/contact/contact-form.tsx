"use client";

import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { apiFetch, errorMessage, fieldError } from "@/lib/api-client";
import { contactSchema } from "@/lib/contact-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/shared/states";
import { FormField } from "@/components/forms/form-field";

type Field = "name" | "email" | "subject" | "message";
type Errors = Partial<Record<Field, string>>;
const FIELDS: Field[] = ["name", "email", "subject", "message"];
const EMPTY = { name: "", email: "", subject: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setFormError(null);

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors as Partial<Record<Field, string[]>>;
      const next: Errors = {};
      for (const f of FIELDS) if (flat[f]?.[0]) next[f] = flat[f]![0];
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");

    try {
      await apiFetch("/api/contact", { method: "POST", json: parsed.data });
      setValues(EMPTY);
      setStatus("sent");
    } catch (err) {
      const serverErrors: Errors = {};
      for (const f of FIELDS) {
        const msg = fieldError(err, f);
        if (msg) serverErrors[f] = msg;
      }
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) setFormError(errorMessage(err));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-navy">Message sent</h3>
        <p className="max-w-sm text-sm text-navy/75">Thank you. Our team will get back to you within 1&ndash;2 business days.</p>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <InlineAlert variant="error" title="Your message was not sent">{formError}</InlineAlert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="contact-name" label="Name" error={errors.name}>
          {(a) => <Input {...a} name="name" required autoComplete="name" value={values.name} onChange={set("name")} />}
        </FormField>
        <FormField id="contact-email" label="Email" error={errors.email}>
          {(a) => (
            <Input {...a} name="email" type="email" inputMode="email" required autoComplete="email" value={values.email} onChange={set("email")} />
          )}
        </FormField>
      </div>

      <FormField id="contact-subject" label="Subject" error={errors.subject}>
        {(a) => <Input {...a} name="subject" required value={values.subject} onChange={set("subject")} />}
      </FormField>

      <FormField id="contact-message" label="Message" error={errors.message} hint="Please don't include sensitive health details in this form.">
        {(a) => <Textarea {...a} name="message" required rows={6} value={values.message} onChange={set("message")} />}
      </FormField>

      <Button type="submit" disabled={status === "sending"} className="self-start">
        {status === "sending" ? (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Sending&hellip;
          </>
        ) : (
          <>
            <Send aria-hidden="true" /> Send message
          </>
        )}
      </Button>
    </form>
  );
}
