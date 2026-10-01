import { HOW_IT_WORKS } from "@/content/site-content";

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
          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <li
                key={step.title}
                className="animate-fade-in-up group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Step number and header */}
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-blue/20 transition-all duration-300 group-hover:from-cyan/40 group-hover:to-blue/40 group-hover:scale-110">
                    <span className="text-2xl font-black text-cyan">{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-black text-navy leading-tight">
                    {step.title}
                  </h3>
                </div>

                {/* Step description */}
                <p className="text-sm text-navy/70 leading-relaxed">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
