import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { RegisterForm } from "@/app/register/register-form";

export const metadata: Metadata = { title: "Create an account — DentiCare360" };

export default function RegisterPage() {
  return (
    <div className="container-app flex justify-center py-12 sm:py-16">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-tight text-navy">Create your patient account</h1>
          <CardDescription>Book appointments and manage your care in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
