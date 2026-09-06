import { Link } from "@tanstack/react-router";
import { Bookmark, Gauge, History, Wind } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal, useInView } from "./Reveal";
import { cn } from "@/lib/utils";

const JOURNEYS = [
  { from: "Home", to: "Office", aqi: 84, kind: "Cleanest" },
  { from: "Office", to: "Gym", aqi: 121, kind: "Balanced" },
  { from: "Home", to: "Riverside Campus", aqi: 72, kind: "Cleanest" },
];

const TREND = [118, 104, 96, 108, 88, 79, 72];

export function DashboardPreview() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const max = Math.max(...TREND);

  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            Your journeys, tracked over time.
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Your dashboard keeps your sensitivity profile, saved places, recent journeys and average
            pollution exposure in one place.
          </p>
        </Reveal>

        <Reveal delay={180} className="mt-10">
          <div ref={ref} className="rounded-[2rem] border border-border bg-card p-5 shadow-lift md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-xl font-bold">Welcome back</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your sensitivity: <span className="font-medium text-foreground">High</span> · Lower-exposure
                  routes recommended today
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs">
                <Wind className="size-3.5 text-primary" /> Current AQI{" "}
                <span className="font-semibold tabular-nums">96</span>
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-border bg-surface/60 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Gauge className="size-4 text-primary" /> Average pollution exposure
                </p>
                <div className="mt-5 flex h-28 items-end gap-2">
                  {TREND.map((v, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-md bg-primary/70 transition-[height] duration-700 ease-out"
                      style={{ height: inView ? `${(v / max) * 100}%` : "4%", transitionDelay: `${i * 70}ms` }}
                      title={`AQI ${v}`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Last 7 planned journeys · trending cleaner</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface/60 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <History className="size-4 text-primary" /> Recent journeys
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {JOURNEYS.map((j, i) => (
                      <li
                        key={j.to}
                        className={cn("flex items-center justify-between gap-3 ep-reveal", inView && "ep-in")}
                        style={{ animationDelay: `${200 + i * 140}ms` }}
                      >
                        <span className="truncate text-muted-foreground">
                          {j.from} → <span className="text-foreground">{j.to}</span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {j.kind} · AQI {j.aqi}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-surface/60 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Bookmark className="size-4 text-primary" /> Saved places
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {["Home", "Office", "Riverside Campus"].map((p) => (
                      <span key={p} className="rounded-full border border-border bg-card px-3 py-1">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="mt-6">
              <Link to="/dashboard">Explore your dashboard</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
