import { ArrowRight, Circle, Clock, Gauge, Leaf, MapPin, Sparkles, Wind, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LANDING_ROUTES, LANDING_TRIP } from "@/lib/ecopath/landing";
import { cn } from "@/lib/utils";

import { useInView } from "./Reveal";

const STROKE: Record<string, string> = {
  LOW: "var(--aqi-good)",
  MODERATE: "var(--aqi-moderate)",
  HIGH: "var(--aqi-unhealthy)",
};

const BADGE: Record<string, string> = {
  LOW: "bg-aqi-good/12 text-aqi-good border-aqi-good/30",
  MODERATE: "bg-aqi-moderate/18 text-aqi-moderate border-aqi-moderate/40",
  HIGH: "bg-aqi-unhealthy/12 text-aqi-unhealthy border-aqi-unhealthy/30",
};

const PATHS: Record<string, string> = {
  fast: "M40 208 C 110 200, 128 62, 210 58 S 330 74, 372 44",
  balanced: "M40 208 C 128 190, 176 150, 236 134 S 330 92, 372 44",
  clean: "M40 208 C 96 240, 196 232, 254 184 S 344 84, 372 44",
};

const ICON: Record<string, typeof Leaf> = { clean: Leaf, balanced: Gauge, fast: Zap };

/**
 * Interactive hero visualisation: a navigation-style canvas with three route
 * alternatives, plus a miniature "compare routes" demo of the real planner.
 */
export function HeroShowcase() {
  const { ref, inView } = useInView<HTMLDivElement>("0px");
  const [selected, setSelected] = useState("clean");
  const [compared, setCompared] = useState(false);

  const active = LANDING_ROUTES.find((r) => r.id === selected) ?? LANDING_ROUTES[0]!;

  return (
    <div ref={ref} className="relative">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />

      <div className="ep-glass overflow-hidden rounded-[2rem] border border-border/70 shadow-lift">
        {/* trip header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="min-w-0 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 truncate">
              <Circle className="size-3 shrink-0 fill-primary text-primary" />
              <span className="truncate font-medium">{LANDING_TRIP.origin}</span>
            </p>
            <p className="flex items-center gap-2 truncate">
              <MapPin className="size-3.5 shrink-0 text-aqi-unhealthy" />
              <span className="truncate font-medium">{LANDING_TRIP.destination}</span>
            </p>
          </div>
          <Button size="sm" onClick={() => setCompared(true)} className="shrink-0">
            Compare routes
          </Button>
        </div>

        {/* map canvas */}
        <div className="ep-grid relative bg-surface/60">
          <svg
            viewBox="0 0 412 252"
            className="h-56 w-full sm:h-72"
            role="img"
            aria-label="Three route alternatives between Green Park and Riverside Campus, coloured by pollution exposure"
          >
            {LANDING_ROUTES.map((route, i) => {
              const isSel = route.id === selected;
              return (
                <g key={route.id}>
                  <path
                    d={PATHS[route.id]}
                    fill="none"
                    stroke={STROKE[route.level]}
                    strokeWidth={isSel ? 6 : 3.5}
                    strokeLinecap="round"
                    opacity={isSel ? 1 : 0.35}
                    className={cn(inView && "ep-draw")}
                    style={{ animationDelay: `${i * 220}ms`, transition: "stroke-width .3s, opacity .3s" }}
                  />
                  {isSel && (
                    <path
                      d={PATHS[route.id]}
                      fill="none"
                      stroke={STROKE[route.level]}
                      strokeWidth={14}
                      strokeLinecap="round"
                      opacity={0.14}
                    />
                  )}
                  <path
                    d={PATHS[route.id]}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={22}
                    className="cursor-pointer"
                    onClick={() => setSelected(route.id)}
                  />
                </g>
              );
            })}

            {inView &&
              [0, 1, 2].map((i) => (
                <circle key={i} r="3.5" fill="var(--primary)" opacity="0.9">
                  <animateMotion dur="4s" begin={`${i * 1.3}s`} repeatCount="indefinite" path={PATHS[selected]} />
                </circle>
              ))}

            <circle cx="40" cy="208" r="8" fill="var(--primary)" stroke="var(--card)" strokeWidth="3.5" />
            <circle cx="372" cy="44" r="8" fill="var(--aqi-unhealthy)" stroke="var(--card)" strokeWidth="3.5" />
          </svg>

          {/* floating data cards */}
          <div className="ep-float ep-glass absolute top-4 right-4 rounded-xl border border-border/70 px-3 py-2 text-[11px] shadow-soft">
            <p className="text-muted-foreground">Current AQI</p>
            <p className="font-display text-base font-semibold tabular-nums">{active.aqi}</p>
          </div>
          <div
            className="ep-float ep-glass absolute bottom-4 left-4 rounded-xl border border-border/70 px-3 py-2 text-[11px] shadow-soft"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="text-muted-foreground">Traffic</p>
            <p className="font-medium">{active.level === "HIGH" ? "Heavy" : active.level === "MODERATE" ? "Moderate" : "Light"}</p>
          </div>
          <div
            className="ep-float ep-glass absolute right-6 bottom-6 rounded-xl border border-border/70 px-3 py-2 text-[11px] shadow-soft"
            style={{ animationDelay: "2.4s" }}
          >
            <p className="text-muted-foreground">Pollution exposure</p>
            <p className="font-medium">{active.level === "LOW" ? "Low" : active.level === "MODERATE" ? "Moderate" : "High"}</p>
          </div>
        </div>

        {/* route options */}
        <ul className="space-y-2 p-4">
          {LANDING_ROUTES.map((route) => {
            const Icon = ICON[route.id] ?? Leaf;
            const isSel = route.id === selected;
            return (
              <li key={route.id}>
                <button
                  type="button"
                  onClick={() => setSelected(route.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300",
                    isSel
                      ? "border-primary/60 bg-primary/8 shadow-soft"
                      : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-xl",
                      isSel ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{route.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {route.minutes} min · {route.km} km · {route.roads}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", BADGE[route.level])}>
                      {route.level}
                    </span>
                    <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">AQI {route.aqi}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* comparison verdict */}
        <div
          className={cn(
            "grid transition-all duration-500 ease-out",
            compared ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="mx-4 mb-4 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/8 px-4 py-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">EcoPath recommends the Cleanest route.</span>{" "}
                Only 7 minutes slower than the fastest option, but substantially lower predicted pollution
                exposure (AQI 72 vs 158).
              </p>
            </div>
          </div>
        </div>

        {!compared && (
          <p className="flex items-center gap-1.5 px-5 pb-4 text-[11px] text-muted-foreground">
            <Wind className="size-3.5 text-primary" /> Tap a route to preview it, or compare all three.
            <ArrowRight className="size-3" />
          </p>
        )}
      </div>
    </div>
  );
}
