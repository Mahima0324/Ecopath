import { ArrowRight, Check, Clock, Leaf, Zap } from "lucide-react";

import { RECOMMENDATION_REASONS } from "@/lib/ecopath/landing";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

const FASTEST = [
  ["Travel time", "29 min"],
  ["Distance", "12.6 km"],
  ["Air quality", "AQI 158"],
  ["Traffic", "Heavy"],
  ["Pollution exposure", "High"],
];

const ECOPATH = [
  ["Travel time", "36 min"],
  ["Distance", "11.8 km"],
  ["Air quality", "AQI 72"],
  ["Traffic", "Moderate"],
  ["Pollution exposure", "Low"],
];

function Column({
  title,
  icon: Icon,
  rows,
  highlight,
  delay,
}: {
  title: string;
  icon: typeof Zap;
  rows: string[][];
  highlight?: boolean;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className={cn(
          "rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1",
          highlight
            ? "border-primary/50 bg-primary/6 shadow-lift"
            : "border-border bg-card shadow-soft hover:shadow-lift",
        )}
      >
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
          <Icon className={cn("size-4", highlight ? "text-primary" : "text-muted-foreground")} />
          {title}
        </p>
        <dl className="mt-5 space-y-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="font-display text-base font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}

export function WhyEcoPath() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
          Your fastest route isn't always your <span className="text-primary">best</span> route.
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Same trip, two very different journeys. EcoPath weighs what the fastest option costs you in air
          quality before it makes a recommendation.
        </p>
      </Reveal>

      <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Column title="Fastest route" icon={Zap} rows={FASTEST} delay={120} />
        <Reveal delay={200} className="grid place-items-center">
          <span className="grid size-11 place-items-center rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground shadow-soft">
            vs
          </span>
        </Reveal>
        <Column title="EcoPath route" icon={Leaf} rows={ECOPATH} highlight delay={280} />
      </div>

      <Reveal delay={200} className="mt-8">
        <div className="rounded-3xl border border-border bg-surface/70 p-6">
          <p className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 shadow-soft">
              <Clock className="size-3.5 text-muted-foreground" /> +7 min
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="text-primary">Lower predicted pollution exposure</span>
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {RECOMMENDATION_REASONS.map((reason, i) => (
              <Reveal as="li" key={reason} delay={260 + i * 110} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {reason}
              </Reveal>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Why EcoPath recommends this route — every recommendation is explained in the planner too.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
