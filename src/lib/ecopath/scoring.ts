import { aqiCategory } from "./aqi";
import type { PollutionCategory, ScoreBreakdown } from "./types";

/**
 * Weights used by the pollution-aware route scorer.
 * Tune these in one place; a future ML model can replace `scoreRoutes`
 * entirely as long as it keeps returning `ScoredRoute[]`.
 */
export interface ScoringWeights {
  pollution: number;
  duration: number;
  distance: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  pollution: 0.5,
  duration: 0.25,
  distance: 0.25,
};

export interface ScorerInput {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  /** Time-weighted mean AQI along the route, or null when unavailable. */
  aqiExposure: number | null;
}

export interface ScoredRoute {
  id: string;
  breakdown: ScoreBreakdown | null;
  pollutionCategory: PollutionCategory | null;
  recommended: boolean;
  explanation: string | null;
}

/** Min-max normalization; returns 0 for every item when the range collapses. */
function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-9) {
    return values.map(() => 0);
  }
  return values.map((v) => (v - min) / (max - min));
}

function minutes(seconds: number) {
  return Math.round(seconds / 60);
}

/**
 * pollutionRouteScorer — transparent, explainable route ranking.
 *
 * Every metric is min-max normalized across the candidate set (0 = best in
 * this set, 1 = worst), then combined with configurable weights. The lowest
 * overall score wins. When air-quality data is missing for every candidate,
 * the scorer falls back to time + distance only and says so.
 */
export function pollutionRouteScorer(
  routes: ScorerInput[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoredRoute[] {
  if (routes.length === 0) return [];

  const hasPollution = routes.every((r) => r.aqiExposure != null);
  const normPollution = hasPollution ? normalize(routes.map((r) => r.aqiExposure as number)) : routes.map(() => 0);
  const normDuration = normalize(routes.map((r) => r.durationSeconds));
  const normDistance = normalize(routes.map((r) => r.distanceMeters));

  // Re-weight time and distance when pollution data is unavailable so the
  // score stays on the same 0–1 scale instead of silently shrinking.
  const activeTotal = hasPollution
    ? weights.pollution + weights.duration + weights.distance
    : weights.duration + weights.distance;

  const scored: ScoredRoute[] = routes.map((route, i) => {
    const pollution = normPollution[i] ?? 0;
    const duration = normDuration[i] ?? 0;
    const distance = normDistance[i] ?? 0;
    const weighted =
      (hasPollution ? weights.pollution * pollution : 0) +
      weights.duration * duration +
      weights.distance * distance;

    const breakdown: ScoreBreakdown = {
      normalizedPollution: pollution,
      normalizedDuration: duration,
      normalizedDistance: distance,
      pollutionScore: pollution,
      overallScore: activeTotal > 0 ? weighted / activeTotal : 0,
    };

    return {
      id: route.id,
      breakdown,
      pollutionCategory: aqiCategory(route.aqiExposure),
      recommended: false as boolean,
      explanation: null as string | null,
    };
  });

  let bestIndex = 0;
  scored.forEach((s, i) => {
    if ((s.breakdown?.overallScore ?? 1) < (scored[bestIndex]?.breakdown?.overallScore ?? 1)) bestIndex = i;
  });

  const best = scored[bestIndex]!;
  best.recommended = true;
  best.explanation = buildExplanation(routes, bestIndex, hasPollution);
  return scored;
}

function buildExplanation(routes: ScorerInput[], bestIndex: number, hasPollution: boolean): string {
  const best = routes[bestIndex]!;

  if (routes.length === 1) {
    return hasPollution
      ? "Only one route was available for this trip, so there is nothing to compare its estimated pollution exposure against."
      : "Only one route was available for this trip.";
  }

  if (!hasPollution) {
    return "Air-quality data was unavailable for at least one alternative, so this route was ranked on travel time and distance only.";
  }

  // Compare against the fastest alternative — that is the route a
  // conventional planner would have picked.
  let fastestIndex = 0;
  routes.forEach((r, i) => {
    if (r.durationSeconds < routes[fastestIndex]!.durationSeconds) fastestIndex = i;
  });

  if (fastestIndex === bestIndex) {
    return "This route is both the quickest option and has the lowest estimated pollution exposure of the alternatives.";
  }

  const fastest = routes[fastestIndex]!;
  const bestAqi = best.aqiExposure as number;
  const fastAqi = fastest.aqiExposure as number;
  const extraMinutes = minutes(best.durationSeconds - fastest.durationSeconds);
  const timePhrase =
    extraMinutes <= 0 ? "without taking any longer" : `while adding about ${extraMinutes} min`;

  if (fastAqi > 0 && bestAqi < fastAqi) {
    const pct = Math.round(((fastAqi - bestAqi) / fastAqi) * 100);
    return `Recommended because this route has approximately ${pct}% lower estimated pollution exposure than the quickest alternative, ${timePhrase}.`;
  }

  return `Recommended for the best overall balance of estimated pollution exposure, travel time and distance ${timePhrase}.`;
}