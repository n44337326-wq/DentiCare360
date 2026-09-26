import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { ServiceFinder } from "@/components/home/service-finder";
import { FeaturedDoctors } from "@/components/home/featured-doctors";
import { AiPromo } from "@/components/home/ai-promo";
import { WhyUs } from "@/components/home/why-us";
import { Testimonials } from "@/components/home/testimonials";
import { HowItWorks } from "@/components/content/how-it-works";
import { Faq } from "@/components/content/faq";
import { GENERAL_FAQS } from "@/content/site-content";
import { SkeletonRows } from "@/components/shared/states";

// Featured doctors show live next-available slots, so the page is rendered per request.
export const dynamic = "force-dynamic";

function SectionFallback({ tinted = false }: { tinted?: boolean }) {
  return (
    <div className={tinted ? "bg-soft-blue py-16" : "py-16"}>
      <div className="container-app">
        <SkeletonRows rows={2} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<SectionFallback />}>
        <ServiceFinder />
      </Suspense>
      <Suspense fallback={<SectionFallback tinted />}>
        <FeaturedDoctors />
      </Suspense>
      <HowItWorks />
      <AiPromo />
      <WhyUs />
      <Testimonials />
      <div className="container-app py-16">
        <Faq
          items={GENERAL_FAQS}
          description="Quick answers about booking, availability and your records."
        />
      </div>
    </>
  );
}
