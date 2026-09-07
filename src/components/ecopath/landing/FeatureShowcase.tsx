import { Bot, Brain, Leaf, Route as RouteIcon, Send } from "lucide-react";

import { AI_SUGGESTIONS, ROAD_MIX_DEMO, SENSITIVITY_DEMO } from "@/lib/ecopath/landing";
import { cn } from "@/lib/utils";

import { Reveal, useInView } from "./Reveal";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RouteVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="ep-grid overflow-hidden rounded-2xl border border-border bg-surface/60">
      <svg viewBox="0 0 340 130" className="h-32 w-full" role="img" aria-label="Two route options compared by pollution exposure">
        <path
          d="M24 104 C 96 100, 120 26, 190 26 S 292 40, 316 22"
          fill="none"
          stroke="var(--aqi-unhealthy)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.4"
          className={cn(inView && "ep-draw")}
        />
        <path
          d="M24 104 C 70 120, 150 116, 196 90 S 288 44, 316 22"
          fill="none"
          stroke="var(--aqi-good)"
          strokeWidth="6"
          strokeLinecap="round"
          className={cn(inView && "ep-draw")}
          style={{ animationDelay: "180ms" }}
        />
        <circle cx="24" cy="104" r="6" fill="var(--primary)" stroke="var(--card)" strokeWidth="3" />
        <circle cx="316" cy="22" r="6" fill="var(--aqi-unhealthy)" stroke="var(--card)" strokeWidth="3" />
      </svg>
    </div>
  );
}

function SensitivityVisual() {
  return (
    <ul className="space-y-2">
      {SENSITIVITY_DEMO.filter((s) => s.key !== "moderate").map((s, i) => (
        <Reveal as="li" key={s.key} delay={i * 120}>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 px-3.5 py-3">
            <span className="w-24 shrink-0 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              {s.label}
            </span>
            <span className="text-sm font-medium">{s.pick}</span>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

function RoadMixVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref}>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
        {ROAD_MIX_DEMO.map((row, i) => (
          <div
            key={row.label}
            className={cn("h-full transition-[width] duration-700 ease-out", `bg-${row.token}`)}
            style={{ width: inView ? `${row.share * 100}%` : "0%", transitionDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {ROAD_MIX_DEMO.map((row, i) => (
          <li
            key={row.label}
            className={cn("flex items-center justify-between text-sm ep-reveal", inView && "ep-in")}
            style={{ animationDelay: `${i * 180}ms` }}
          >
            <span className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", `bg-${row.token}`)} />
              {row.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{row.km} km</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-surface/60 p-3.5">
      <div className={cn("ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground ep-reveal", inView && "ep-in")}>
        Which route should I take today?
      </div>
      <div
        className={cn("mt-2 flex max-w-[92%] gap-2 ep-reveal", inView && "ep-in")}
        style={{ animationDelay: "700ms" }}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
          <Bot className="size-3" />
        </span>
        <p className="rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2 text-xs leading-relaxed">
          Based on your sensitivity level and current air-quality conditions, I recommend the lower-exposure
          route. It adds about 7 minutes but reduces predicted pollution exposure.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {AI_SUGGESTIONS.map((q, i) => (
          <span
            key={q}
            className={cn(
              "rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground ep-reveal",
              inView && "ep-in",
            )}
            style={{ animationDelay: `${1100 + i * 120}ms` }}
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Leaf,
    title: "Pollution-aware routing",
    body: "Every route is evaluated for pollution exposure — not just distance and time.",
    visual: <RouteVisual />,
  },
  {
    icon: Brain,
    title: "Personalised recommendations",
    body: "Your recommendation adapts to the pollution sensitivity you choose during onboarding.",
    visual: <SensitivityVisual />,
  },
  {
    icon: RouteIcon,
    title: "Road-type intelligence",
    body: "EcoPath considers where your journey takes place, not just how long it takes.",
    visual: <RoadMixVisual />,
  },
  {
    icon: Send,
    title: "Ask EcoPath AI",
    body: "A copilot that explains the recommendation and answers follow-up questions about your trip.",
    visual: <AiVisual />,
  },
];

export function FeatureShowcase() {
  return (
    <section id="features" className="border-y border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            Navigation that thinks beyond distance.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 110}>
                <Frame className="h-full">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                  <div className="mt-5">{f.visual}</div>
                </Frame>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

