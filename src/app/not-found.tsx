import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found — DentiCare360" };

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm font-semibold text-navy-light">404</p>
      <h1 className="text-3xl font-semibold text-navy">Page not found</h1>
      <p className="max-w-md text-navy/75">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/doctors">Find a doctor</Link>
        </Button>
      </div>
    </div>
  );
}
