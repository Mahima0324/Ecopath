import { THINKING_STEPS } from "@/lib/ecopath/landing";

import { Reveal } from "./Reveal";

export function HowItThinks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
          How EcoPath thinks.
        </h2>
      </Reveal>

      <ol className="relative mt-12 grid gap-6 md:grid-cols-4">
        <span
          className="pointer-events-none absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block"
          aria-hidden
        />
        {THINKING_STEPS.map((step, i) => (
          <Reveal as="li" key={step.n} delay={i * 160} className="relative">
            <span className="relative z-10 grid size-12 place-items-center rounded-2xl border border-primary/30 bg-card font-display text-sm font-bold text-primary shadow-soft">
              {step.n}
            </span>
            <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
