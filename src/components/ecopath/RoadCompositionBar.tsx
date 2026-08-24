import { ROAD_EMOJI, ROAD_LABEL } from "@/lib/ecopath/roads";
import { formatDistance } from "@/lib/ecopath/format";
import { cn } from "@/lib/utils";
import type { RoadShare } from "@/lib/ecopath/types";

const FILL: Record<string, string> = {
  highway: "bg-aqi-unhealthy",
  main: "bg-aqi-moderate",
  local: "bg-aqi-good",
};

export function RoadCompositionBar({
  composition,
  compact = false,
  className,
}: {
  composition: RoadShare[];
  compact?: boolean;
  className?: string;
}) {
  if (composition.length === 0) {
    return <p className={cn("text-xs text-muted-foreground", className)}>Road mix unavailable.</p>;
  }

  return (
    <div className={className}>
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        {composition.map((row) => (
          <div
            key={row.roadClass}
            className={cn("h-full", FILL[row.roadClass])}
            style={{ width: `${row.share * 100}%` }}
            title={`${ROAD_LABEL[row.roadClass]} ${Math.round(row.share * 100)}%`}
          />
        ))}
      </div>
      <ul
        className={cn(
          "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
          compact && "text-[11px]",
        )}
      >
        {composition.map((row) => (
          <li key={row.roadClass} className="flex items-center gap-1.5">
            <span aria-hidden>{ROAD_EMOJI[row.roadClass]}</span>
            <span className="font-medium text-foreground">{ROAD_LABEL[row.roadClass]}</span>
            <span className="tabular-nums">
              {formatDistance(row.distanceMeters)} · {Math.round(row.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
