import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal, useInView } from "./Reveal";
import { cn } from "@/lib/utils";

export function FinalCta() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="bg-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M-20 340 C 240 300, 340 120, 620 140 S 980 220, 1220 60"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          opacity="0.35"
          className={cn(inView && "ep-draw")}
        />
        <path
          d="M-20 380 C 300 380, 420 220, 700 220 S 1000 280, 1220 160"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.2"
          className={cn(inView && "ep-draw")}
          style={{ animationDelay: "300ms" }}
        />
      </svg>

      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <h2 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-5xl">
            Your destination hasn't changed.
            <br />
            <span className="text-primary">Your route can.</span>
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Choose a route that's better informed by the air around you.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <Button asChild size="lg" className="group mt-8">
            <Link to="/planner">
              Plan my cleaner route
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
