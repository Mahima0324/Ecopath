import { LANDING_STATS } from "@/lib/ecopath/landing";

import { CountUp, Reveal } from "./Reveal";

export function StatsBand() {
  return (
    <section className="border-y border-border bg-surface/70">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 90} className="text-center sm:text-left">
            <p className="font-display text-3xl font-bold text-primary md:text-4xl">
              {"value" in stat ? (
                <>
                  <CountUp value={stat.value} />
                  {stat.suffix}
                </>
              ) : (
                stat.text
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
