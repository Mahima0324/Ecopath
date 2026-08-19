import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Pollution-aware route planning built on OpenStreetMap routing and live open air-quality
            data. Estimates only — EcoPath does not provide medical advice.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/planner" className="transition-colors hover:text-foreground">
                Route planner
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/learn" className="transition-colors hover:text-foreground">
                Air quality guide
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Data sources</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>OpenStreetMap &amp; OSRM routing</li>
            <li>Open-Meteo air quality</li>
            <li>Nominatim geocoding</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EcoPath. Map data © OpenStreetMap contributors.
      </div>
    </footer>
  );
}