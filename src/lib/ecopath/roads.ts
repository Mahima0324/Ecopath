/**
 * Road-character analysis.
 *
 * OSRM returns turn-by-turn steps with a distance, duration, road name and
 * (for classified roads) a reference such as "NH 48" or "A4". We derive the
 * road class from that real data — never from invented values — and use it
 * to estimate how much of a trip runs alongside heavy traffic, which is the
 * dominant source of roadside PM2.5 and NO2.
 */

import type { RoadClass, RoadSegment, RoadShare, TrafficLevel, TravelMode } from "./types";

export const ROAD_LABEL: Record<RoadClass, string> = {
  highway: "Highway",
  main: "Main road",
  local: "Local street",
};

export const ROAD_EMOJI: Record<RoadClass, string> = {
  highway: "🚗",
  main: "🏙️",
  local: "🏘️",
};

/** Relative roadside pollution exposure per road class (0–1). */
export const ROAD_EXPOSURE: Record<RoadClass, number> = {
  highway: 1,
  main: 0.55,
  local: 0.18,
};

/** Speed thresholds (km/h) that separate road classes, per travel mode. */
const SPEED_THRESHOLDS: Record<TravelMode, { highway: number; main: number }> = {
  driving: { highway: 65, main: 32 },
  cycling: { highway: Number.POSITIVE_INFINITY, main: 19 },
  walking: { highway: Number.POSITIVE_INFINITY, main: 7 },
};

export interface StepLike {
  distanceMeters: number;
  durationSeconds: number;
  name: string | null;
  ref: string | null;
}

export function classifyStep(step: StepLike, mode: TravelMode): RoadClass {
  const kmh = step.durationSeconds > 0 ? (step.distanceMeters / step.durationSeconds) * 3.6 : 0;
  const thresholds = SPEED_THRESHOLDS[mode];
  const hasRef = !!step.ref && step.ref.trim().length > 0;

  if (mode === "driving" && hasRef && kmh >= 45) return "highway";
  if (kmh >= thresholds.highway) return "highway";
  if (hasRef || kmh >= thresholds.main) return "main";
  return "local";
}

/** Groups raw segments into per-class distance/duration shares, biggest first. */
export function buildComposition(segments: RoadSegment[]): RoadShare[] {
  const total = segments.reduce((sum, s) => sum + s.distanceMeters, 0);
  const classes: RoadClass[] = ["highway", "main", "local"];

  return classes
    .map((roadClass) => {
      const rows = segments.filter((s) => s.roadClass === roadClass);
      const distanceMeters = rows.reduce((sum, s) => sum + s.distanceMeters, 0);
      const durationSeconds = rows.reduce((sum, s) => sum + s.durationSeconds, 0);
      return {
        roadClass,
        distanceMeters,
        durationSeconds,
        share: total > 0 ? distanceMeters / total : 0,
      };
    })
    .filter((row) => row.distanceMeters > 0)
    .sort((a, b) => b.distanceMeters - a.distanceMeters);
}

/** 0–1 index of how exposed the route is to busy-road emissions. */
export function roadExposureIndex(composition: RoadShare[]): number {
  return composition.reduce((sum, row) => sum + row.share * ROAD_EXPOSURE[row.roadClass], 0);
}

/**
 * Estimated traffic intensity. Public routing data has no live congestion
 * feed, so we estimate it from the road mix: motorways and arterials carry
 * far denser traffic than residential streets.
 */
export function estimateTraffic(index: number): TrafficLevel {
  if (index >= 0.62) return "Heavy";
  if (index >= 0.32) return "Moderate";
  return "Light";
}

export function describeComposition(composition: RoadShare[]): string {
  if (composition.length === 0) return "Road mix unavailable for this route.";
  return composition
    .map((row) => `${ROAD_LABEL[row.roadClass].toLowerCase()} ${Math.round(row.share * 100)}%`)
    .join(", ");
}

export function dominantClass(composition: RoadShare[]): RoadClass | null {
  return composition[0]?.roadClass ?? null;
}
