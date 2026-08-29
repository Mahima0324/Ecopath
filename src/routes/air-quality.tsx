import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Droplets, Gauge, Thermometer, Wind } from "lucide-react";
import { Suspense, lazy, useState } from "react";

import { AqiBadge } from "@/components/ecopath/AqiBadge";
import { PageShell } from "@/components/ecopath/PageShell";
import { PlaceInput } from "@/components/ecopath/PlaceInput";
import { Skeleton } from "@/components/ui/skeleton";
import { getAreaAirQuality, getLocationAirQuality } from "@/lib/ecopath.functions";
import { AQI_CATEGORY_GUIDE, aqiCategory } from "@/lib/ecopath/aqi";
import type { NamedPlace } from "@/lib/ecopath/types";

const AirQualityMap = lazy(() => import("@/components/ecopath/AirQualityMap"));

const title = "Air quality near you — EcoPath";
const description =
  "Check live AQI, PM2.5, PM10, NO₂ and weather for any place, and see how pollution varies across the area.";

export const Route = createFileRoute("/air-quality")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AirQualityPage,
});

/** 3x3 grid of sample points roughly 3 km apart around a place. */
function gridAround(place: NamedPlace) {
  const step = 0.03;
  const points: { lat: number; lon: number }[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      points.push({ lat: place.lat + dy * step, lon: place.lon + dx * step });
    }
  }
  return points;
}

function AirQualityPage() {
  const [place, setPlace] = useState<NamedPlace | null>(null);
  const locationAq = useServerFn(getLocationAirQuality);
  const areaAq = useServerFn(getAreaAirQuality);

  const current = useQuery({
    queryKey: ["location-aq", place?.lat, place?.lon],
    queryFn: () => locationAq({ data: { place: place! } }),
    enabled: !!place,
  });

  const area = useQuery({
    queryKey: ["area-aq", place?.lat, place?.lon],
    queryFn: () => areaAq({ data: { points: gridAround(place!) } }),
    enabled: !!place,
  });

  const reading = current.data ?? null;

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Air quality</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Live readings from Open-Meteo. Search a place to see the current air quality, how it varies across
          the surrounding area, and what it means for your journey.
        </p>

        <div className="mt-8 max-w-md rounded-2xl border border-border bg-card p-5 shadow-soft">
          <PlaceInput
            id="aq-place"
            label="Location"
            placeholder="e.g. Karol Bagh, Delhi"
            value={place}
            onChange={setPlace}
          />
        </div>

        {!place && (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
            Pick a location above. Planning a trip instead?{" "}
            <Link to="/planner" className="text-primary hover:underline">
              Open the route planner
            </Link>
            .
          </p>
        )}

        {place && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">{place.label}</p>
                {current.isPending ? (
                  <Skeleton className="mt-4 h-16 w-40" />
                ) : current.isError || !reading ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Air-quality data is unavailable for this location right now.
                  </p>
                ) : (
                  <>
                    <p className="mt-3 font-display text-5xl font-bold tabular-nums">
                      {reading.aqi == null ? "—" : Math.round(reading.aqi)}
                    </p>
                    <div className="mt-3">
                      <AqiBadge aqi={reading.aqi} showValue={false} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {aqiCategory(reading.aqi) === "Good"
                        ? "Air is clean — any route works well today."
                        : "Prefer lower-exposure routes and avoid long stretches beside heavy traffic."}
                    </p>
                  </>
                )}
              </div>

              {reading && (
                <div className="grid grid-cols-2 gap-3">
                  <Metric icon={Gauge} label="PM2.5" value={reading.pm25} unit="µg/m³" />
                  <Metric icon={Gauge} label="PM10" value={reading.pm10} unit="µg/m³" />
                  <Metric icon={Wind} label="NO₂" value={reading.no2} unit="µg/m³" />
                  <Metric icon={Wind} label="Ozone" value={reading.o3} unit="µg/m³" />
                  <Metric
                    icon={Thermometer}
                    label="Temperature"
                    value={reading.weather?.temperatureC ?? null}
                    unit="°C"
                  />
                  <Metric
                    icon={Droplets}
                    label="Humidity"
                    value={reading.weather?.humidity ?? null}
                    unit="%"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="h-[380px] overflow-hidden rounded-2xl border border-border shadow-soft">
                {area.isPending || !area.data ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <AirQualityMap center={place} readings={area.data} />
                  </Suspense>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Each circle is a live sample roughly 3 km apart. Colour shows the AQI band at that point.
              </p>
            </div>
          </div>
        )}

        <h2 className="mt-14 font-display text-xl font-semibold">What the numbers mean</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AQI_CATEGORY_GUIDE.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">AQI {item.range}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.meaning}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Gauge;
  label: string;
  value: number | null | undefined;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums">
        {value == null ? "—" : value.toFixed(1)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
