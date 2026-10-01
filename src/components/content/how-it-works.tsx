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

        <div className="mx-auto max-w-6xl">
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => {
              const icons = [MessageCircle, Users, CheckCircle, Calendar];
              const Icon = icons[i];
              return (
                <li
                  key={step.title}
                  className="animate-fade-in-up group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-cyan/30">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan to-blue" />

                    {/* Icon */}
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan/15 to-blue/15 transition-all duration-300 group-hover:from-cyan/30 group-hover:to-blue/30 group-hover:scale-110">
                      <Icon className="h-6 w-6 text-cyan" strokeWidth={2} />
                    </div>

                    {/* Step number badge */}
                    <div className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-sm font-black text-white shadow-md">
                      {i + 1}
                    </div>

                    {/* Content */}
                    <h3 className="pr-8 text-lg font-black text-navy leading-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-navy/70 leading-relaxed">
                      {step.desc}
                    </p>
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
