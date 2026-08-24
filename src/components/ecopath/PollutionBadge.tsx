import { cn } from "@/lib/utils";
import type { PollutionLevel } from "@/lib/ecopath/types";

const STYLES: Record<PollutionLevel, string> = {
  LOW: "bg-aqi-good/15 text-aqi-good border-aqi-good/30",
  MODERATE: "bg-aqi-moderate/20 text-aqi-moderate border-aqi-moderate/40",
  HIGH: "bg-aqi-unhealthy/15 text-aqi-unhealthy border-aqi-unhealthy/30",
};

export function PollutionBadge({
  level,
  className,
}: {
  level: PollutionLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        STYLES[level],
        className,
      )}
    >
      {level} POLLUTION
    </span>
  );
}
