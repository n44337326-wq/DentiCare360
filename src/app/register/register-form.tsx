"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch, errorMessage, fieldError } from "@/lib/api-client";
import { registerSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/shared/states";
import { FormField } from "@/components/forms/form-field";

type Field = "name" | "email" | "password" | "phone";
type Errors = Partial<Record<Field, string>>;
type Phase = "form" | "signing-in" | "created";

const FIELDS: Field[] = ["name", "email", "password", "phone"];

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [submitting, setSubmitting] = useState(false);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors as Partial<Record<Field, string[]>>;
      const next: Errors = {};
      for (const f of FIELDS) if (flat[f]?.[0]) next[f] = friendly(f, flat[f]![0]);
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await apiFetch("/api/register", { method: "POST", json: parsed.data });
    } catch (err) {
      const serverErrors: Errors = {};
      for (const f of FIELDS) {
        const msg = fieldError(err, f);
        if (msg) serverErrors[f] = msg;
      }
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) setFormError(errorMessage(err));
      setSubmitting(false);
      return;
    }

    // Account exists now: try to sign the new patient straight in.
    setPhase("signing-in");
    try {
      const res = await signIn("credentials", { email: parsed.data.email, password: values.password, redirect: false });
      if (res && !res.error) {
        router.push("/patient/dashboard");
        router.refresh();
        return;
      }
    } catch {
      // fall through to the manual sign-in prompt
    }
    setPhase("created");
    setSubmitting(false);
  }

  if (phase !== "form") {
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <InlineAlert variant="success" title="Your account has been created">
          {phase === "signing-in" ? "Signing you in…" : "You can now sign in with your email and password."}
        </InlineAlert>
        {phase === "signing-in" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-navy/75">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Taking you to your dashboard
          </p>
        ) : (
          <Button asChild>
            <Link href="/login">Go to sign in</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <InlineAlert variant="error" title={formError} />}

      <FormField id="name" label="Full name" error={errors.name}>
        {(a) => <Input {...a} name="name" required autoComplete="name" value={values.name} onChange={set("name")} />}
      </FormField>

      <FormField id="email" label="Email" error={errors.email}>
        {(a) => (
          <Input {...a} name="email" type="email" inputMode="email" required autoComplete="email" value={values.email} onChange={set("email")} />
        )}
      </FormField>

      <FormField id="password" label="Password" error={errors.password} hint="At least 8 characters with a letter and a number.">
        {(a) => (
          <div className="relative">
            <Input
              {...a}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className="pr-11"
              value={values.password}
              onChange={set("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-navy/70 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        )}
      </FormField>

      <FormField id="phone" label="Phone" optional error={errors.phone}>
        {(a) => <Input {...a} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} />}
      </FormField>

      <Button type="submit" disabled={submitting} className="mt-1">
        {submitting ? (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Creating account&hellip;
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-navy/75">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-navy underline underline-offset-2 hover:text-navy-light">
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** Zod's default wording for empty or malformed input is technical; say what the person should do. */
function friendly(field: Field, message: string): string {
  if (field === "name") return "Enter your full name (at least 2 characters).";
  if (field === "email") return "Enter a valid email address.";
  if (field === "phone") return "Enter a valid phone number, for example +1 555 010 2000.";
  return message;
}
