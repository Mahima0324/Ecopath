import { Leaf } from "lucide-react";

import { formatDistance, formatDuration } from "@/lib/ecopath/format";
import { ROAD_LABEL } from "@/lib/ecopath/roads";
import { cn } from "@/lib/utils";
import type { AnalyzedRoute, RouteAnalysis } from "@/lib/ecopath/types";

function highwayShare(route: AnalyzedRoute) {
  const row = route.roadComposition.find((r) => r.roadClass === "highway");
  return row ? Math.round(row.share * 100) : 0;
}

function dominantRoad(route: AnalyzedRoute) {
  const row = route.roadComposition[0];
  return row ? `Mostly ${ROAD_LABEL[row.roadClass].toLowerCase()}s` : "Unknown";
}

const ROWS: { label: string; value: (r: AnalyzedRoute) => string }[] = [
  { label: "Time", value: (r) => formatDuration(r.durationSeconds) },
  { label: "Distance", value: (r) => formatDistance(r.distanceMeters) },
  { label: "Pollution", value: (r) => `${r.pollutionLevel[0]}${r.pollutionLevel.slice(1).toLowerCase()}` },
  { label: "AQI exposure", value: (r) => (r.aqiExposure == null ? "—" : String(Math.round(r.aqiExposure))) },
  { label: "Traffic", value: (r) => r.trafficLevel },
  { label: "Highway exposure", value: (r) => `${highwayShare(r)}%` },
  { label: "Road character", value: dominantRoad },
  { label: "EcoPath score", value: (r) => `${r.ecoScore.total}/100` },
];

export function RouteComparison({
  analysis,
  selectedId,
  onSelect,
}: {
  analysis: RouteAnalysis;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const routes = analysis.routes;
  if (routes.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-display text-lg font-semibold">Side-by-side comparison</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap a column to preview that route on the map.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-36 py-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
              {routes.map((route) => (
                <th key={route.id} className="p-1 align-bottom">
                  <button
                    type="button"
                    onClick={() => onSelect(route.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                      route.id === selectedId
                        ? "border-primary bg-primary/8"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="block text-sm font-semibold">{route.name}</span>
                    {route.recommended && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Leaf className="size-3" /> Recommended
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-border/70">
                <th scope="row" className="py-2.5 text-left text-xs font-medium text-muted-foreground">
                  {row.label}
                </th>
                {routes.map((route) => (
                  <td
                    key={route.id}
                    className={cn(
                      "px-3 py-2.5 text-center font-medium tabular-nums",
                      route.id === selectedId && "bg-primary/5",
                    )}
                  >
                    {row.value(route)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-xl border border-primary/25 bg-primary/8 p-4">
        <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
          <Leaf className="size-4" /> EcoPath recommendation
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{analysis.recommendationSummary}</p>
      </div>
    </section>
  );
}
