import { HOW_IT_WORKS } from "@/content/site-content";

/** Four-step explainer of the patient journey. */
export function HowItWorks({ tinted = false }: { tinted?: boolean }) {
  return (
    <section aria-labelledby="how-heading" className={tinted ? "bg-soft-blue py-16" : "py-16"}>
      <div className="container-app">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 id="how-heading" className="text-4xl font-black text-navy">
            How DentiCare360 works
          </h2>
          <p className=”mt-3 text-lg text-navy/70”>From need help to your appointment in four simple steps.</p>
        </div>
        <ol className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li
              key={step.title}
              className="animate-fade-in-up relative text-center"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="mb-6 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-lg font-black text-white shadow-lg">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-xl font-black text-navy leading-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-navy/70 leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
