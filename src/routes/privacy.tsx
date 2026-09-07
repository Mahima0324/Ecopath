import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/ecopath/PageShell";

const title = "Privacy — EcoPath";
const description =
  "How EcoPath handles your account, saved places, route history and air-quality lookups.";

export const Route = createFileRoute("/privacy")({
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
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Privacy</h1>
        <div className="mt-6 space-y-5 text-muted-foreground">
          <p>
            EcoPath stores only what it needs to plan routes for you: your account email, the sensitivity
            preferences you choose, the places you save and the journeys you plan.
          </p>
          <p>
            Route geometry comes from OpenStreetMap-based routing and air-quality readings come from
            Open-Meteo. Search terms and coordinates are sent to those services to produce results; they
            are not linked to your profile.
          </p>
          <p>
            Your saved places and route history are visible only to you and can be deleted from your
            dashboard at any time.
          </p>
          <p>
            EcoPath reports air-quality estimates for planning purposes. It is not a medical service and
            does not provide medical advice.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
