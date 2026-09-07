import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/ecopath/PageShell";

const title = "Terms — EcoPath";
const description = "The terms for using EcoPath's pollution-aware route recommendations.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Terms</h1>
        <div className="mt-6 space-y-5 text-muted-foreground">
          <p>
            EcoPath provides route suggestions based on estimated pollution exposure, traffic, road type,
            distance and travel time. Recommendations are estimates and should be treated as guidance,
            not instructions.
          </p>
          <p>
            Always follow local traffic rules and road signage. EcoPath is not responsible for conditions
            on the road, routing data errors, or gaps in third-party air-quality measurements.
          </p>
          <p>
            EcoPath does not provide medical advice. Sensitivity levels are personalisation preferences,
            not a health assessment.
          </p>
          <p>Map data © OpenStreetMap contributors. Air-quality data from Open-Meteo.</p>
        </div>
      </article>
    </PageShell>
  );
}
