import { Bookmark, Check, Clock, Gauge, Leaf, Route as RouteIcon, TrafficCone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AqiBadge } from "./AqiBadge";
import { PollutionBadge } from "./PollutionBadge";
import { RoadCompositionBar } from "./RoadCompositionBar";
import { formatDistance, formatDuration } from "@/lib/ecopath/format";
import { cn } from "@/lib/utils";
import type { AnalyzedRoute } from "@/lib/ecopath/types";

export { formatDistance, formatDuration };

interface RouteCardProps {
  route: AnalyzedRoute;
  selected: boolean;
  onSelect: () => void;
  onSave?: (() => void) | undefined;
  saving?: boolean | undefined;
  saved?: boolean | undefined;
}

export function RouteCard({ route, selected, onSelect, onSave, saving, saved }: RouteCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer rounded-2xl border bg-card p-4 transition-all",
        selected
          ? "border-primary shadow-lift ring-1 ring-primary/25"
          : "border-border shadow-soft hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">{route.name}</h3>
          {route.recommended && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Leaf className="size-3" /> Recommended for you
            </span>
          )}
        </div>
        <PollutionBadge level={route.pollutionLevel} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Metric icon={Clock} label="Time" value={formatDuration(route.durationSeconds)} />
        <Metric icon={RouteIcon} label="Distance" value={formatDistance(route.distanceMeters)} />
        <Metric
          icon={Gauge}
          label="AQI exposure"
          value={route.aqiExposure == null ? "—" : String(Math.round(route.aqiExposure))}
        />
        <Metric icon={TrafficCone} label="Traffic" value={route.trafficLevel} />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <AqiBadge aqi={route.aqiExposure} />
        <span className="text-xs text-muted-foreground">
          EcoPath score <span className="font-semibold tabular-nums text-foreground">{route.ecoScore.total}</span>
          /100
        </span>
      </div>

      <RoadCompositionBar composition={route.roadComposition} compact className="mt-4" />

      <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs leading-relaxed text-surface-foreground">
        <span className="font-semibold">Why: </span>
        {route.explanation}
      </p>

      {onSave && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={saving || saved}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
          {saved ? "Saved" : saving ? "Saving..." : "Save this route"}
        </Button>
      )}
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3" /> {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
