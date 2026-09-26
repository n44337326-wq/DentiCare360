"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineAlert } from "@/components/shared/states";
import { DemoAccounts } from "@/app/login/demo-accounts";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin",
};

/** Only same-origin relative paths are honoured, so a crafted link can't bounce a user to another site. */
function safeCallback(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (!res || res.error) {
        setError("Incorrect email or password");
        setLoading(false);
        return;
      }

      const session = await getSession();
      const destination =
        safeCallback(params.get("callbackUrl")) ?? DASHBOARD_BY_ROLE[session?.user?.role ?? ""] ?? "/";
      router.push(destination);
      router.refresh();
    } catch {
      setError("We couldn't sign you in right now. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <InlineAlert variant="error" title={error}>
            If you have tried several times, please wait a few minutes before trying again.
          </InlineAlert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <Button type="submit" disabled={loading} className="mt-1">
          {loading ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Signing in&hellip;
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <DemoAccounts
        disabled={loading}
        onPick={(demoEmail, demoPassword) => {
          setEmail(demoEmail);
          setPassword(demoPassword);
          setError(null);
        }}
      />

      <p className="text-center text-sm text-navy/75">
        New to DentiCare360?{" "}
        <Link href="/register" className="font-medium text-navy underline underline-offset-2 hover:text-navy-light">
          Create an account
        </Link>
      </p>
    </div>
  );
}
