import { Bot, Circle, Clock, Leaf, MapPin } from "lucide-react";

import { HERO_DEMO } from "@/lib/ecopath/demo";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<string, string> = {
  LOW: "bg-aqi-good/15 text-aqi-good border-aqi-good/30",
  MODERATE: "bg-aqi-moderate/20 text-aqi-moderate border-aqi-moderate/40",
  HIGH: "bg-aqi-unhealthy/15 text-aqi-unhealthy border-aqi-unhealthy/30",
};

const LINE_STROKE: Record<string, string> = {
  LOW: "var(--aqi-good)",
  MODERATE: "var(--aqi-moderate)",
  HIGH: "var(--aqi-unhealthy)",
};

/** Illustrative product preview used on the landing page hero. */
export function HeroRoutePreview() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-lift sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1.5 text-sm">
          <p className="flex items-center gap-2 truncate">
            <Circle className="size-3 shrink-0 fill-primary text-primary" />
            <span className="truncate font-medium">{HERO_DEMO.origin}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <MapPin className="size-3.5 shrink-0 text-aqi-unhealthy" />
            <span className="truncate font-medium">{HERO_DEMO.destination}</span>
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          3 alternatives
        </span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        <svg viewBox="0 0 320 150" className="h-40 w-full sm:h-44" role="img" aria-label="Three route alternatives between two points, coloured by pollution exposure">
          <defs>
            <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0H0V26" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="320" height="150" fill="url(#grid)" className="text-foreground" />
          <path
            d="M28 118 C 90 118, 105 40, 165 38 S 262 46, 292 34"
            fill="none"
            stroke={LINE_STROKE["HIGH"]}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M28 118 C 96 108, 130 92, 180 84 S 258 56, 292 34"
            fill="none"
            stroke={LINE_STROKE["MODERATE"]}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M28 118 C 74 132, 150 128, 196 104 S 268 62, 292 34"
            fill="none"
            stroke={LINE_STROKE["LOW"]}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="28" cy="118" r="7" fill="var(--primary)" stroke="white" strokeWidth="3" />
          <circle cx="292" cy="34" r="7" fill={LINE_STROKE["HIGH"]} stroke="white" strokeWidth="3" />
        </svg>
      </div>

      <ul className="mt-4 space-y-2">
        {HERO_DEMO.routes.map((route) => (
          <li
            key={route.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-3.5 py-3",
              route.recommended ? "border-primary bg-primary/8" : "border-border bg-background",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {route.recommended && <Leaf className="size-3.5 text-primary" />}
                {route.name}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" /> {route.minutes} min · {route.km} km · {route.roads}
              </p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  LEVEL_STYLE[route.level],
                )}
              >
                {route.level}
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">AQI {route.aqi}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-surface px-3.5 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
          <Bot className="size-3.5" />
        </span>
        <p className="text-xs leading-relaxed text-surface-foreground">
          <span className="font-semibold">EcoPath AI:</span> the cleanest route cuts predicted pollution
          exposure by about 54% for 7 extra minutes — worth it at your sensitivity level.
        </p>
      </div>
    </div>
  );
}
