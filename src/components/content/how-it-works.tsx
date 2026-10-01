import { HOW_IT_WORKS } from "@/content/site-content";
import { MessageCircle, Users, CheckCircle, Calendar } from "lucide-react";

/** Four-step explainer of the patient journey. */
export function HowItWorks({ tinted = false }: { tinted?: boolean }) {
  return (
    <section aria-labelledby="how-heading" className={tinted ? "bg-soft-blue py-20" : "py-20"}>
      <div className="container-app">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 id="how-heading" className="text-4xl font-black text-navy">
            How DentiCare360 works
          </h2>
          <p className="mt-4 text-lg text-navy/70">From need help to your appointment in four simple steps.</p>
        </div>

        <div className="mx-auto max-w-5xl">
          <ol className="space-y-8">
            {HOW_IT_WORKS.map((step, i) => {
              const icons = [MessageCircle, Users, CheckCircle, Calendar];
              const Icon = icons[i];
              const isEven = i % 2 === 0;
              return (
                <li
                  key={step.title}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`flex items-start gap-8 ${isEven ? "flex-row" : "flex-row-reverse"}`}>
                    {/* Left: Icon and Number */}
                    <div className="relative flex-shrink-0 pt-2">
                      {/* Step number circle */}
                      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-2xl font-black text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                        {i + 1}
                      </div>

                      {/* Connecting line to next step */}
                      {i < 3 && (
                        <div className="absolute top-20 left-1/2 h-16 w-1 -translate-x-1/2 bg-gradient-to-b from-cyan to-transparent" />
                      )}
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-cyan/15 to-blue/15 p-3 transition-all duration-300 hover:from-cyan/25 hover:to-blue/25">
                          <Icon className="h-6 w-6 text-cyan" strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-navy leading-tight">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-navy/70 leading-relaxed pl-16">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
