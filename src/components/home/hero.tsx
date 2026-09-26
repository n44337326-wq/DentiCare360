import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole, Sparkles, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroVisual } from "@/components/home/hero-visual";
import "./hero.css";

const TRUST = [
  { icon: BadgeCheck, label: "Verified doctors" },
  { icon: LockKeyhole, label: "Secure records" },
  { icon: UserRoundCheck, label: "Human-led care" },
];

/** One word of the headline; the mask clips the slide-up so words appear to rise out of the line. */
function Word({ children, delay, glow = false }: { children: string; delay: number; glow?: boolean }) {
  return (
    <span className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom">
      <span className={glow ? "hero-grad" : "hero-word"} style={{ animationDelay: glow ? `${delay}ms, 0s` : `${delay}ms` }}>
        {children}
      </span>
    </span>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_80%_0%,#134074_0%,#0b2545_48%,#071a33_100%)] text-white"
    >
      <HeroBackdrop />

      <div className="container-app relative z-10 grid items-center gap-14 pb-28 pt-14 lg:min-h-[43rem] lg:grid-cols-[minmax(0,10fr)_minmax(0,11fr)] lg:gap-10 lg:pb-32 lg:pt-20">
        <div>
          <h1
            id="hero-heading"
            className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl"
          >
            <span className="block">
              <Word delay={100}>Complete</Word> <Word delay={200}>Care.</Word>
            </span>
            <span className="relative mt-1 inline-block">
              <Word delay={330} glow>
                One
              </Word>{" "}
              <Word delay={430} glow>
                Trusted
              </Word>{" "}
              <Word delay={530} glow>
                Clinic.
              </Word>
              <svg
                aria-hidden="true"
                className="hero-underline absolute -bottom-2 left-0 h-3 w-full"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <linearGradient id="hero-underline-grad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#13a3b3" />
                    <stop offset="0.55" stopColor="#5ee0ee" />
                    <stop offset="1" stopColor="#3fae7c" />
                  </linearGradient>
                </defs>
                <path
                  d="M2 8 C 60 2, 130 12, 200 5 S 280 4, 298 7"
                  stroke="url(#hero-underline-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={1}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
          </h1>

          <p className="hero-rise mt-8 max-w-xl text-lg text-white/75" style={{ animationDelay: "700ms" }}>
            From your smile and skin to everyday health, connect with the right healthcare professional from one secure
            platform.
          </p>

          <div className="hero-rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "850ms" }}>
            <span className="hero-glow-btn">
              <Button size="lg" asChild className="hero-cta group relative overflow-hidden bg-white text-navy hover:bg-white">
                <Link href="/appointments/book">
                  <span className="hero-shine" aria-hidden="true" />
                  Book an Appointment{" "}
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
            </span>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="group border-white/25 bg-white/10 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/15"
            >
              <Link href="/ai-assistant">
                <Sparkles
                  className="text-cyan-light transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                  aria-hidden="true"
                />{" "}
                Ask AI Health Assistant
              </Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-3 text-sm text-white/90" aria-label="Why patients trust us">
            {TRUST.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className="hero-rise flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm"
                style={{ animationDelay: `${1000 + i * 110}ms` }}
              >
                <Icon className="h-4 w-4 text-cyan-light" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>

      {/* Wave into the next (white) section */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 h-10 overflow-hidden text-white">
        <svg className="hero-wave h-full" viewBox="0 0 2880 40" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0 40V20C240 -2 480 -2 720 20C960 42 1200 42 1440 20C1680 -2 1920 -2 2160 20C2400 42 2640 42 2880 20V40Z"
          />
        </svg>
      </div>
    </section>
  );
}
