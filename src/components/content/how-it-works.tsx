import { HOW_IT_WORKS } from "@/content/site-content";

/** Four-step explainer of the patient journey. */
export function HowItWorks({ tinted = false }: { tinted?: boolean }) {
  return (
    <section aria-labelledby="how-heading" className={tinted ? "bg-soft-blue py-16" : "py-16"}>
      <div className="container-app">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="how-heading" className="text-3xl font-semibold text-navy">
            How DentiCare360 works
          </h2>
          <p className="mt-2 text-navy/75">From “I need help” to your appointment in four simple steps.</p>
        </div>
        <ol className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li
              key={step.title}
              className="animate-fade-in-up relative rounded-xl border border-border bg-white p-6 shadow-sm"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-navy">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-navy/75">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
