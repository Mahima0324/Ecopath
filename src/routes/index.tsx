import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Gauge, LineChart, MapPinned, Route as RouteIcon, Wind } from "lucide-react";

import { PageShell } from "@/components/ecopath/PageShell";
import { Button } from "@/components/ui/button";
import { AQI_CATEGORY_GUIDE } from "@/lib/ecopath/aqi";

const title = "EcoPath — Pollution-aware smart route planner";
const description =
  "EcoPath compares route alternatives by live air quality, travel time and distance so you can choose the cleanest way to get there.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: MapPinned,
    title: "Every alternative, mapped",
    body: "We pull real road, cycle and footpath alternatives from OpenStreetMap and draw them side by side.",
  },
  {
    icon: Wind,
    title: "Live air quality sampling",
    body: "AQI, PM2.5 and PM10 are sampled at evenly spaced points along each route — not just at your destination.",
  },
  {
    icon: Gauge,
    title: "A transparent score",
    body: "Pollution counts for half the score; time and distance split the rest. Every recommendation is explained.",
  },
  {
    icon: LineChart,
    title: "Your travel history",
    body: "Save routes you rely on and see how often you picked the cleaner option over the fastest one.",
  },
];

function Index() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="bg-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Wind className="size-3.5 text-primary" /> Live air-quality routing
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight font-bold tracking-tight md:text-6xl">
            Take the route that's <span className="text-primary">easier to breathe</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            The fastest way there is rarely the cleanest. EcoPath scores every alternative on live
            pollution alongside time and distance, then tells you exactly why one route wins.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/planner">
                <RouteIcon className="size-4" /> Plan a route
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/learn">How scoring works</Link>
            </Button>
          </div>

          <dl className="mt-14 grid max-w-2xl gap-6 sm:grid-cols-3">
            {[
              { k: "3", v: "travel modes: walk, cycle, drive" },
              { k: "8", v: "air-quality samples per route" },
              { k: "0", v: "API keys or setup needed" },
            ].map((item) => (
              <div key={item.v}>
                <dt className="font-display text-3xl font-bold text-primary">{item.k}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Built for people who breathe the city
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Know your numbers</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            EcoPath labels every route with the standard AQI scale, so a colour tells you the story at
            a glance.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AQI_CATEGORY_GUIDE.map((cat) => (
              <div key={cat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{cat.label}</p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">AQI {cat.range}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Bike className="mx-auto size-6 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Ready to plan a cleaner trip?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Enter a start and destination — EcoPath does the rest in seconds.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link to="/planner">Open the route planner</Link>
        </Button>
      </section>
    </PageShell>
  );
}
