import { Bookmark, Check, Clock, Route as RouteIcon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AqiBadge } from "./AqiBadge";
import { cn } from "@/lib/utils";
import type { AnalyzedRoute } from "@/lib/ecopath/types";

export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number) {
  const total = Math.round(seconds / 60);
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h ${total % 60} min`;
}

interface RouteCardProps {
  route: AnalyzedRoute;
  selected: boolean;
  onSelect: () => void;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
}

export function RouteCard({ route, selected, onSelect, onSave, saving, saved }: RouteCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer rounded-2xl border bg-card p-4 transition-all",
        selected ? "border-primary shadow-lift ring-1 ring-primary/25" : "border-border shadow-soft hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{route.name}</h3>
          {route.recommended && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> Recommended: healthier route
            </span>
          )}
        </div>
        <AqiBadge aqi={route.aqiExposure} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <RouteIcon className="size-3" /> Distance
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{formatDistance(route.distanceMeters)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> Time
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{formatDuration(route.durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Route score</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {route.breakdown ? (100 - route.breakdown.overallScore * 100).toFixed(0) : "—"}
            <span className="text-xs font-normal text-muted-foreground">/100</span>
          </dd>
        </div>
      </dl>

      {route.breakdown && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Relative pollution exposure in this comparison</span>
            <span className="tabular-nums">{Math.round(route.breakdown.pollutionScore * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-brand-gradient h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, route.breakdown.pollutionScore * 100)}%` }}
            />
          </div>
        </div>
      )}

      {route.explanation && (
        <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs leading-relaxed text-surface-foreground">
          {route.explanation}
        </p>
      )}

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