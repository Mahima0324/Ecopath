import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/ecopath/PageShell";
import { Button } from "@/components/ui/button";
import { AQI_CATEGORY_GUIDE } from "@/lib/ecopath/aqi";

const title = "Understanding air quality — EcoPath";
const description =
  "What AQI, PM2.5 and PM10 mean, how exposure affects your health, and how EcoPath scores routes on pollution.";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: LearnPage,
});

const TOKEN_CLASS: Record<string, string> = {
  Good: "bg-aqi-good",
  Moderate: "bg-aqi-moderate",
  "Unhealthy for Sensitive Groups": "bg-aqi-sensitive",
  Unhealthy: "bg-aqi-unhealthy",
  "Very Unhealthy": "bg-aqi-very-unhealthy",
  Hazardous: "bg-aqi-hazardous",
};

function LearnPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">Understanding air quality</h1>
        <p className="mt-3 text-muted-foreground">
          Air pollution is invisible, but its effects are not. Knowing what the numbers mean makes it
          much easier to decide when — and where — to walk, ride or drive.
        </p>

        <h2 className="mt-10 font-display text-xl font-semibold">The pollutants EcoPath tracks</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              term: "AQI",
              body: "The Air Quality Index converts pollutant concentrations into a single 0–500+ scale. Lower is cleaner.",
            },
            {
              term: "PM2.5",
              body: "Fine particles under 2.5 µm. Small enough to reach deep into the lungs and enter the bloodstream.",
            },
            {
              term: "PM10",
              body: "Coarser dust and smoke under 10 µm. Irritates the airways and worsens asthma and allergies.",
            },
          ].map((item) => (
            <div key={item.term} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <h3 className="font-display font-semibold">{item.term}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">AQI categories</h2>
        <ul className="mt-4 space-y-2">
          {AQI_CATEGORY_GUIDE.map((cat) => (
            <li
              key={cat.label}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft"
            >
              <span
                aria-hidden
                className={`size-3 shrink-0 rounded-full ${TOKEN_CLASS[cat.label] ?? "bg-muted"}`}
              />
              <span className="w-56 font-medium">{cat.label}</span>
              <span className="w-20 text-sm tabular-nums text-muted-foreground">{cat.range}</span>
              <span className="flex-1 text-sm text-muted-foreground">{cat.meaning}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-display text-xl font-semibold">How EcoPath scores a route</h2>
        <p className="mt-3 text-muted-foreground">
          For each alternative we sample air quality at evenly spaced points along the path and average
          them into a single exposure figure. Exposure, travel time and distance are then normalised
          across the alternatives and combined — pollution counts for half the score, with time and
          distance splitting the rest. The route with the lowest combined score is recommended.
        </p>
        <p className="mt-3 text-muted-foreground">
          Air-quality data comes from the Open-Meteo Air Quality API and route geometry from
          OpenStreetMap. EcoPath is an informational tool, not medical advice.
        </p>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/planner">Plan a route</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}