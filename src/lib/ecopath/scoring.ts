import { aqiCategory } from "./aqi";
import { ROAD_LABEL } from "./roads";
import { DEFAULT_PREFERENCES } from "./preferences";
import type {
  EcoScore,
  PollutionLevel,
  RoadShare,
  RouteKind,
  ScoreBreakdown,
  SensitivityLevel,
  TrafficLevel,
  UserRoutePreferences,
} from "./types";

/**
 * Weights used by the pollution-aware route scorer. They shift with the
 * user's declared pollution sensitivity: a very sensitive traveller trades
 * far more time for cleaner air than someone who isn't affected.
 */
export interface ScoringWeights {
  pollution: number;
  duration: number;
  distance: number;
  roadExposure: number;
}

const SENSITIVITY_WEIGHTS: Record<SensitivityLevel, ScoringWeights> = {
  low: { pollution: 0.3, duration: 0.45, distance: 0.1, roadExposure: 0.15 },
  moderate: { pollution: 0.45, duration: 0.3, distance: 0.1, roadExposure: 0.15 },
  high: { pollution: 0.6, duration: 0.18, distance: 0.07, roadExposure: 0.15 },
  very_high: { pollution: 0.72, duration: 0.1, distance: 0.05, roadExposure: 0.13 },
};

export const DEFAULT_WEIGHTS = SENSITIVITY_WEIGHTS.moderate;

/** Resolves the weight vector for a user profile. */
export function weightsFor(preferences: UserRoutePreferences): ScoringWeights {
  const base = { ...SENSITIVITY_WEIGHTS[preferences.sensitivity] };

  if (preferences.preferCleaner === "yes") {
    const shift = Math.min(0.1, base.duration);
    base.pollution += shift;
    base.duration -= shift;
  } else if (preferences.preferCleaner === "no") {
    const shift = Math.min(0.15, base.pollution);
    base.duration += shift;
    base.pollution -= shift;
  }

  return base;
}

export interface ScorerInput {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  /** Mean AQI along the route, or null when unavailable. */
  aqiExposure: number | null;
  /** 0–1 share of the trip alongside busy roads. */
  roadExposureIndex: number;
  trafficLevel: TrafficLevel;
  roadComposition: RoadShare[];
}

export interface ScoredRoute {
  id: string;
  kind: RouteKind;
  name: string;
  breakdown: ScoreBreakdown;
  ecoScore: EcoScore;
  pollutionCategory: ReturnType<typeof aqiCategory>;
  pollutionLevel: PollutionLevel;
  recommended: boolean;
  explanation: string;
}

export interface ScoringResult {
  routes: ScoredRoute[];
  recommendedId: string | null;
  summary: string;
}

/** Min-max normalization; returns 0 for every item when the range collapses. */
function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-9) return values.map(() => 0);
  return values.map((v) => (v - min) / (max - min));
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function minutes(seconds: number) {
  return Math.round(seconds / 60);
}

function pollutionLevelFor(aqi: number | null, roadIndex: number): PollutionLevel {
  if (aqi == null) return roadIndex >= 0.6 ? "HIGH" : roadIndex >= 0.32 ? "MODERATE" : "LOW";
  const blended = aqi * (0.85 + 0.3 * roadIndex);
  if (blended >= 140) return "HIGH";
  if (blended >= 80) return "MODERATE";
  return "LOW";
}

const TRAFFIC_PENALTY: Record<TrafficLevel, number> = { Light: 0.1, Moderate: 0.45, Heavy: 0.85 };

/**
 * Absolute, human-readable EcoPath score (0–100). Unlike the ranking cost,
 * this does not depend on the other candidates except for the small
 * distance/time components, which are relative to the best option shown.
 */
function ecoScoreFor(
  route: ScorerInput,
  normDuration: number,
  normDistance: number,
): EcoScore {
  const airQuality = route.aqiExposure == null ? 45 * 0.6 : 45 * clamp01(1 - (route.aqiExposure - 20) / 180);
  const traffic = 20 * (1 - TRAFFIC_PENALTY[route.trafficLevel]);
  const roadExposure = 20 * (1 - clamp01(route.roadExposureIndex));
  const distance = 10 * (1 - normDistance);
  const travelTime = 10 * (1 - normDuration);

  const round = (v: number) => Math.round(v * 10) / 10;
  const total = Math.round(airQuality + traffic + roadExposure + distance + travelTime);

  return {
    total,
    airQuality: round(airQuality),
    traffic: round(traffic),
    roadExposure: round(roadExposure),
    distance: round(distance),
    travelTime: round(travelTime),
  };
}

/**
 * pollutionRouteScorer — transparent, explainable, personalised ranking.
 *
 * Every metric is min-max normalized across the candidate set (0 = best in
 * this set, 1 = worst), then combined with sensitivity-driven weights. The
 * lowest overall cost wins, subject to the user's maximum acceptable detour.
 */
export function pollutionRouteScorer(
  routes: ScorerInput[],
  preferences: UserRoutePreferences = DEFAULT_PREFERENCES,
): ScoringResult {
  if (routes.length === 0) return { routes: [], recommendedId: null, summary: "" };

  const weights = weightsFor(preferences);
  const hasPollution = routes.every((r) => r.aqiExposure != null);

  const normPollution = hasPollution
    ? normalize(routes.map((r) => r.aqiExposure as number))
    : routes.map(() => 0);
  const normDuration = normalize(routes.map((r) => r.durationSeconds));
  const normDistance = normalize(routes.map((r) => r.distanceMeters));
  const normRoad = normalize(routes.map((r) => r.roadExposureIndex));

  const activeTotal =
    (hasPollution ? weights.pollution : 0) + weights.duration + weights.distance + weights.roadExposure;

  let fastestIndex = 0;
  let cleanestIndex = 0;
  routes.forEach((r, i) => {
    if (r.durationSeconds < routes[fastestIndex]!.durationSeconds) fastestIndex = i;
    const score = (r.aqiExposure ?? 100) * (0.85 + 0.3 * r.roadExposureIndex);
    const bestScore =
      (routes[cleanestIndex]!.aqiExposure ?? 100) * (0.85 + 0.3 * routes[cleanestIndex]!.roadExposureIndex);
    if (score < bestScore) cleanestIndex = i;
  });

  const scored: ScoredRoute[] = routes.map((route, i) => {
    const pollution = normPollution[i] ?? 0;
    const duration = normDuration[i] ?? 0;
    const distance = normDistance[i] ?? 0;
    const road = normRoad[i] ?? 0;

    const weighted =
      (hasPollution ? weights.pollution * pollution : 0) +
      weights.duration * duration +
      weights.distance * distance +
      weights.roadExposure * road;

    const kind: RouteKind = i === cleanestIndex ? "cleanest" : i === fastestIndex ? "fastest" : "balanced";

    return {
      id: route.id,
      kind,
      name:
        kind === "cleanest" ? "Cleanest route" : kind === "fastest" ? "Fastest route" : "Balanced route",
      breakdown: {
        normalizedPollution: pollution,
        normalizedDuration: duration,
        normalizedDistance: distance,
        normalizedRoadExposure: road,
        pollutionScore: pollution,
        overallScore: activeTotal > 0 ? weighted / activeTotal : 0,
      },
      ecoScore: ecoScoreFor(route, duration, distance),
      pollutionCategory: aqiCategory(route.aqiExposure),
      pollutionLevel: pollutionLevelFor(route.aqiExposure, route.roadExposureIndex),
      recommended: false,
      explanation: "",
    };
  });

  // Respect the user's maximum acceptable detour, when one is set.
  const fastestDuration = routes[fastestIndex]!.durationSeconds;
  const limit = preferences.maxExtraMinutes;
  const eligible = routes
    .map((r, i) => i)
    .filter((i) => limit == null || routes[i]!.durationSeconds - fastestDuration <= limit * 60 + 30);
  const pool = eligible.length > 0 ? eligible : routes.map((_, i) => i);

  let bestIndex = pool[0]!;
  pool.forEach((i) => {
    if (scored[i]!.breakdown.overallScore < scored[bestIndex]!.breakdown.overallScore) bestIndex = i;
  });

  scored.forEach((s, i) => {
    s.recommended = i === bestIndex;
    s.explanation = explainRoute(routes, i, fastestIndex, hasPollution, s);
  });

  return {
    routes: scored,
    recommendedId: scored[bestIndex]!.id,
    summary: buildSummary(routes, bestIndex, fastestIndex, hasPollution, preferences, eligible.length > 0),
  };
}

function pollutionDelta(a: number, b: number) {
  return b > 0 ? Math.round(((b - a) / b) * 100) : 0;
}

function explainRoute(
  routes: ScorerInput[],
  index: number,
  fastestIndex: number,
  hasPollution: boolean,
  scored: ScoredRoute,
): string {
  const route = routes[index]!;
  const fastest = routes[fastestIndex]!;
  const dominant = route.roadComposition[0];
  const roadPhrase = dominant
    ? `${Math.round(dominant.share * 100)}% of it runs on ${ROAD_LABEL[dominant.roadClass].toLowerCase()}s`
    : "its road mix could not be determined";

  if (index === fastestIndex && routes.length > 1) {
    return hasPollution
      ? `Fastest option, but ${roadPhrase} and it carries ${scored.pollutionLevel.toLowerCase()} predicted pollution exposure.`
      : `Fastest option — ${roadPhrase}.`;
  }

  const extra = minutes(route.durationSeconds - fastest.durationSeconds);
  if (hasPollution && route.aqiExposure != null && fastest.aqiExposure != null) {
    const pct = pollutionDelta(route.aqiExposure, fastest.aqiExposure);
    if (pct > 0) {
      return `About ${pct}% lower estimated pollution exposure than the fastest route${
        extra > 0 ? `, for roughly ${extra} extra minute${extra === 1 ? "" : "s"}` : " without taking longer"
      }. ${roadPhrase[0]!.toUpperCase()}${roadPhrase.slice(1)}.`;
    }
  }
  return `Adds about ${Math.max(extra, 0)} min versus the fastest route; ${roadPhrase}.`;
}

function buildSummary(
  routes: ScorerInput[],
  bestIndex: number,
  fastestIndex: number,
  hasPollution: boolean,
  preferences: UserRoutePreferences,
  withinLimit: boolean,
): string {
  const best = routes[bestIndex]!;
  const fastest = routes[fastestIndex]!;
  const sensitivity = preferences.sensitivity.replace("_", " ");

  if (routes.length === 1) return "Only one route was available for this trip, so there was nothing to compare it against.";

  if (!hasPollution) {
    return "Air-quality data was unavailable for at least one alternative, so routes were ranked on road type, travel time and distance only.";
  }

  if (bestIndex === fastestIndex) {
    return `Based on your ${sensitivity} sensitivity, we recommend this route: it is both the quickest option and has the lowest predicted pollution exposure.`;
  }

  const extra = minutes(best.durationSeconds - fastest.durationSeconds);
  const pct = pollutionDelta(best.aqiExposure as number, fastest.aqiExposure as number);
  const limitNote =
    !withinLimit && preferences.maxExtraMinutes != null
      ? " No alternative fitted inside your maximum extra travel time, so we ranked all options."
      : "";

  return `Based on your ${sensitivity} sensitivity, we recommend this route: it reduces estimated pollution exposure by about ${Math.max(
    pct,
    0,
  )}% while adding roughly ${Math.max(extra, 0)} minute${extra === 1 ? "" : "s"} to your journey.${limitNote}`;
}
