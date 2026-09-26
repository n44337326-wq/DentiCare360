import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = { title: "Sign in — DentiCare360" };

export default function LoginPage() {
  return (
    <div className="container-app flex justify-center py-12 sm:py-16">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-tight text-navy">Sign in to DentiCare360</h1>
          <CardDescription>Access your patient, doctor or admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams needs a Suspense boundary. */}
          <Suspense fallback={<LoadingState label="Loading sign-in form…" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
