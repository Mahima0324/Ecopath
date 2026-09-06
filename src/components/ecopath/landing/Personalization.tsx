import { useState } from "react";
import { Leaf } from "lucide-react";

import { SENSITIVITY_DEMO } from "@/lib/ecopath/landing";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

export function Personalization() {
  const [active, setActive] = useState<string>("high");
  const current = SENSITIVITY_DEMO.find((s) => s.key === active) ?? SENSITIVITY_DEMO[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
          One route doesn't fit everyone.
        </h2>
      </Reveal>
      <Reveal delay={110}>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Pick the sensitivity level that matches how much cleaner air matters to you — the same journey
          produces a different recommendation. It's a preference setting, not medical advice.
        </p>
      </Reveal>

      <Reveal delay={180} className="mt-10">
        <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-[minmax(0,320px)_1fr] md:p-7">
          <div className="flex flex-wrap gap-2 md:flex-col">
            {SENSITIVITY_DEMO.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex-1 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300 md:flex-none",
                  s.key === active
                    ? "border-primary/60 bg-primary/8 text-foreground shadow-soft"
                    : "border-border bg-surface/60 text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
                )}
                aria-pressed={s.key === active}
              >
                {s.label} sensitivity
              </button>
            ))}
          </div>

          <div key={current.key} className="ep-in rounded-3xl border border-border bg-surface/60 p-6">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Same journey · Green Park → Riverside Campus
            </p>
            <p className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-primary">
              <Leaf className="size-5" /> {current.pick}
            </p>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">{current.detail}</p>
            <p className="mt-5 max-w-md text-sm leading-relaxed">{current.note}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
