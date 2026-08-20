import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/ecopath/PageShell";
import { RoutePlanner } from "@/components/ecopath/RoutePlanner";

const title = "Route planner — EcoPath clean-air routing";
const description =
  "Compare route alternatives by live air quality, travel time and distance, then pick the healthiest way to get there.";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Plan a cleaner route</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          EcoPath compares every alternative between your two points, samples live air quality along
          each one, and recommends the route with the best balance of clean air, time and distance.
        </p>
        <div className="mt-8">
          <RoutePlanner />
        </div>
      </section>
    </PageShell>
  );
}