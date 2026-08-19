import { aqiCategory, aqiToken } from "@/lib/ecopath/aqi";
import { cn } from "@/lib/utils";

const TOKEN_CLASS: Record<string, string> = {
  "aqi-good": "bg-aqi-good/15 text-aqi-good border-aqi-good/30",
  "aqi-moderate": "bg-aqi-moderate/20 text-aqi-moderate border-aqi-moderate/40",
  "aqi-sensitive": "bg-aqi-sensitive/18 text-aqi-sensitive border-aqi-sensitive/35",
  "aqi-unhealthy": "bg-aqi-unhealthy/15 text-aqi-unhealthy border-aqi-unhealthy/30",
  "aqi-very-unhealthy": "bg-aqi-very-unhealthy/15 text-aqi-very-unhealthy border-aqi-very-unhealthy/30",
  "aqi-hazardous": "bg-aqi-hazardous/15 text-aqi-hazardous border-aqi-hazardous/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function AqiBadge({
  aqi,
  showValue = true,
  className,
}: {
  aqi: number | null | undefined;
  showValue?: boolean;
  className?: string;
}) {
  const token = aqiToken(aqi);
  const category = aqiCategory(aqi);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        TOKEN_CLASS[token],
        className,
      )}
    >
      {showValue && <span className="tabular-nums">{aqi == null ? "—" : Math.round(aqi)}</span>}
      <span className="font-medium">{category ?? "No data"}</span>
    </span>
  );
}