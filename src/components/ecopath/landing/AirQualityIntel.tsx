import { Link } from "@tanstack/react-router";
import { Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AQI_ZONES } from "@/lib/ecopath/landing";
import { aqiCategory } from "@/lib/ecopath/aqi";
import { cn } from "@/lib/utils";

import { Reveal, useInView } from "./Reveal";

const ZONE_COLOR: Record<string, string> = {
  Riverside: "var(--aqi-good)",
  Midtown: "var(--aqi-moderate)",
  "Ring Road": "var(--aqi-unhealthy)",
};

export function AirQualityIntel() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_1fr]">
        <div ref={ref} className="ep-grid relative overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
          <div className="relative h-[320px] w-full sm:h-[380px]">
            {AQI_ZONES.map((zone, i) => (
              <div
                key={zone.name}
                className={cn("absolute -translate-x-1/2 -translate-y-1/2 ep-reveal", inView && "ep-in")}
                style={{ left: `${zone.x}%`, top: `${zone.y}%`, animationDelay: `${i * 200}ms` }}
              >
                <span className="relative grid place-items-center">
                  <span
                    className="absolute size-16 rounded-full"
                    style={{
                      background: ZONE_COLOR[zone.name],
                      opacity: 0.18,
                      animation: `ep-pulse-ring 3.4s ${i * 0.7}s ease-out infinite`,
                    }}
                    aria-hidden
                  />
                  <span
                    className="size-4 rounded-full ring-4 ring-card"
                    style={{ background: ZONE_COLOR[zone.name] }}
                  />
                </span>
                <div className="ep-glass mt-2 -translate-x-1/4 rounded-xl border border-border/70 px-3 py-2 text-[11px] shadow-soft">
                  <p className="font-semibold">{zone.name}</p>
                  <p className="font-display text-base font-bold tabular-nums" style={{ color: ZONE_COLOR[zone.name] }}>
                    AQI {zone.aqi}
                  </p>
                  <p className="text-muted-foreground">{aqiCategory(zone.aqi)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Wind className="size-3.5 text-primary" /> Environmental intelligence
            </span>
          </Reveal>
          <Reveal delay={110}>
            <h2 className="mt-6 font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
              The air changes street by street.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 max-w-lg text-muted-foreground">
              EcoPath samples live air quality across the area you're travelling through, so a single
              city-wide number never decides your route.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {AQI_ZONES.map((zone, i) => (
              <Reveal key={zone.name} delay={260 + i * 100}>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                  <p className="text-xs text-muted-foreground">{zone.name}</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums" style={{ color: ZONE_COLOR[zone.name] }}>
                    {zone.aqi}
                  </p>
                  <dl className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <dt>PM2.5</dt>
                      <dd className="tabular-nums">{zone.pm25}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>PM10</dt>
                      <dd className="tabular-nums">{zone.pm10}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Traffic</dt>
                      <dd>{zone.traffic}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={420}>
            <Button asChild variant="outline" size="lg" className="mt-8">
              <Link to="/air-quality">Check live air quality</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
