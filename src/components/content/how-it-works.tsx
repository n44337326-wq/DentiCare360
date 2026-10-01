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
          <ol className="relative flex items-start justify-between gap-4">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-cyan via-cyan to-blue" style={{ top: "2rem", width: "calc(100% - 2rem)", left: "1rem" }} aria-hidden="true" />

            {HOW_IT_WORKS.map((step, i) => (
              <li
                key={step.title}
                className="animate-fade-in-up relative flex-1 text-center group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-6 flex justify-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-xl font-black text-white shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-lg font-black text-navy leading-tight mb-3">
                  {step.title}
                </h3>
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
