import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EcoScore, PollutionLevel } from "@/lib/ecopath/types";

const ROWS: { key: keyof Omit<EcoScore, "total">; label: string; max: number }[] = [
  { key: "airQuality", label: "Air quality", max: 45 },
  { key: "traffic", label: "Traffic", max: 20 },
  { key: "roadExposure", label: "Road exposure", max: 20 },
  { key: "distance", label: "Distance", max: 10 },
  { key: "travelTime", label: "Travel time", max: 10 },
];

export function EcoScoreCard({
  score,
  level,
  className,
}: {
  score: EcoScore;
  level: PollutionLevel;
  className?: string;
}) {
  const tone =
    score.total >= 75 ? "text-aqi-good" : score.total >= 55 ? "text-aqi-moderate" : "text-aqi-unhealthy";

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">EcoPath score</p>
          <p className="mt-1 font-display text-4xl font-bold tabular-nums">
            <span className={tone}>{score.total}</span>
            <span className="text-lg font-medium text-muted-foreground"> / 100</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <Leaf className="size-3.5" /> {level === "LOW" ? "Low" : level === "MODERATE" ? "Moderate" : "High"}{" "}
          pollution exposure
        </span>
      </div>

      <dl className="mt-5 space-y-2.5">
        {ROWS.map((row) => {
          const value = score[row.key];
          return (
            <div key={row.key} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(3, (value / row.max) * 100)}%` }}
                />
              </div>
              <dd className="text-right text-sm font-semibold tabular-nums">
                {value}/{row.max}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        A comparison score for this trip only — not a health measurement.
      </p>
    </div>
  );
}
