import { Link } from "@tanstack/react-router";
import { Bot, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AI_DEMO_THREAD } from "@/lib/ecopath/landing";
import { cn } from "@/lib/utils";

import { Reveal, useInView } from "./Reveal";

export function AiCopilot() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      <div className="bg-hero-glow pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="ep-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1fr_1fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Your route has an AI copilot
            </span>
          </Reveal>
          <Reveal delay={110}>
            <h2 className="mt-6 font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
              Don't just get directions.
              <br />
              <span className="text-primary">Understand your journey.</span>
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-5 max-w-lg text-muted-foreground">
              EcoPath AI explains why a route is recommended and gives personalised general precautions
              based on your route and the pollution conditions along it.
            </p>
          </Reveal>
          <Reveal delay={320}>
            <Button asChild size="lg" className="mt-8">
              <Link to="/planner">Ask about my route</Link>
            </Button>
          </Reveal>
        </div>

        <div ref={ref} className="ep-glass rounded-3xl border border-border/70 p-5 shadow-lift">
          <p className="flex items-center gap-2 border-b border-border/70 pb-3 text-sm font-semibold">
            <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
              <Bot className="size-3.5" />
            </span>
            EcoPath AI
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-normal text-muted-foreground">
              <span className="size-1.5 rounded-full bg-aqi-good" /> online
            </span>
          </p>

          <div className="space-y-3 pt-4">
            {AI_DEMO_THREAD.map((m, i) => (
              <div
                key={m.text}
                className={cn(
                  "ep-reveal max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  inView && "ep-in",
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card",
                )}
                style={{ animationDelay: `${i * 900}ms` }}
              >
                {m.text}
              </div>
            ))}
            <div
              className={cn("flex gap-1 pl-1 ep-reveal", inView && "ep-in")}
              style={{ animationDelay: "600ms" }}
              aria-hidden
            >
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  style={{ animation: `ep-typing 1.2s ${d * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
