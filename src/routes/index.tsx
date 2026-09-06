import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wind } from "lucide-react";

import { PageShell } from "@/components/ecopath/PageShell";
import { AiCopilot } from "@/components/ecopath/landing/AiCopilot";
import { AirQualityIntel } from "@/components/ecopath/landing/AirQualityIntel";
import { DashboardPreview } from "@/components/ecopath/landing/DashboardPreview";
import { FeatureShowcase } from "@/components/ecopath/landing/FeatureShowcase";
import { FinalCta } from "@/components/ecopath/landing/FinalCta";
import { HeroShowcase } from "@/components/ecopath/landing/HeroShowcase";
import { HowItThinks } from "@/components/ecopath/landing/HowItThinks";
import { Personalization } from "@/components/ecopath/landing/Personalization";
import { Reveal } from "@/components/ecopath/landing/Reveal";
import { StatsBand } from "@/components/ecopath/landing/StatsBand";
import { WhyEcoPath } from "@/components/ecopath/landing/WhyEcoPath";
import { Button } from "@/components/ui/button";

const title = "EcoPath — Pollution-aware smart route planner";
const description =
  "EcoPath uses AI and live air-quality intelligence to compare routes by pollution exposure, traffic, road type, distance and time — then recommends the route that fits you.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <PageShell>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="bg-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-16 md:pt-20 lg:grid-cols-[1.02fr_1fr] lg:pb-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <Wind className="size-3.5 text-primary" /> AI-powered pollution-aware routing
              </span>
            </Reveal>

            <Reveal delay={120}>
              <h1 className="mt-6 font-display text-4xl leading-[1.08] font-bold tracking-tight md:text-6xl">
                Take the route that's{" "}
                <span className="text-primary">easier to breathe</span>.
              </h1>
            </Reveal>

            <Reveal delay={260}>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                EcoPath compares routes using air quality, traffic, road type, distance and travel time —
                then recommends the route that best fits you.
              </p>
            </Reveal>

            <Reveal delay={380}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="group transition-transform duration-300 hover:-translate-y-0.5">
                  <Link to="/planner">
                    Plan a cleaner route
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <a href="#features">Explore EcoPath</a>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <HeroShowcase />
          </Reveal>
        </div>
      </section>

      <StatsBand />
      <WhyEcoPath />
      <FeatureShowcase />
      <AiCopilot />
      <Personalization />
      <AirQualityIntel />
      <HowItThinks />
      <DashboardPreview />
      <FinalCta />
    </PageShell>
  );
}
