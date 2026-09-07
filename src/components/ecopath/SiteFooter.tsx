import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";

const PRODUCT = [
  { to: "/planner", label: "Route planner" },
  { to: "/air-quality", label: "Air quality" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/learn", label: "How it works" },
] as const;

const LEGAL = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Pollution-aware route planning for smarter everyday journeys. Estimates only — EcoPath does
            not provide medical advice.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PRODUCT.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">More</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {LEGAL.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>OpenStreetMap &amp; OSRM routing</li>
            <li>Open-Meteo air quality</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EcoPath. Map data © OpenStreetMap contributors.
      </div>
    </footer>
  );
}
