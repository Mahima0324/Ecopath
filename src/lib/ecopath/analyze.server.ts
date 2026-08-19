import { fetchAirQuality } from "./air-quality.server";
import { fetchRoutes } from "./routing.server";
import { DEFAULT_WEIGHTS, pollutionRouteScorer, type ScoringWeights } from "./scoring";
import type { AirQualitySample, AnalyzedRoute, NamedPlace, RouteAnalysis, TravelMode } from "./types";

/** How many air-quality probes to take along each route. */
const SAMPLES_PER_ROUTE = 8;

const ROUTE_NAMES = ["Route A", "Route B", "Route C", "Route D"];

/** Picks evenly spaced coordinates along a polyline, always including both ends. */
function samplePoints(geometry: [number, number][], count: number) {
  if (geometry.length <= count) return geometry;
  const step = (geometry.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => geometry[Math.round(i * step)]!);
}

export async function analyzeRoutes(
  origin: NamedPlace,
  destination: NamedPlace,
  travelMode: TravelMode,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): Promise<RouteAnalysis> {
  const raw = await fetchRoutes(origin, destination, travelMode);

  if (raw.length === 0) {
    return {
      origin,
      destination,
      travelMode,
      routes: [],
      airQualityUnavailable: false,
      airQualityUpdatedAt: null,
    };
  }

  const sampleSets = raw.map((route) => samplePoints(route.geometry, SAMPLES_PER_ROUTE));
  const flatPoints = sampleSets.flat().map(([lat, lon]) => ({ lat, lon }));

  let airQualityUnavailable = false;
  let airQualityUpdatedAt: string | null = null;
  let readings: Awaited<ReturnType<typeof fetchAirQuality>> = [];

  try {
    readings = await fetchAirQuality(flatPoints);
    airQualityUpdatedAt = readings.find((r) => r.measuredAt)?.measuredAt ?? null;
  } catch (error) {
    console.error("Air-quality lookup failed", error);
    airQualityUnavailable = true;
  }

  let cursor = 0;
  const enriched = raw.map((route, i) => {
    const set = sampleSets[i]!;
    const slice = readings.slice(cursor, cursor + set.length);
    cursor += set.length;

    const samples: AirQualitySample[] = set.map(([lat, lon], j) => ({
      lat,
      lon,
      aqi: slice[j]?.aqi ?? null,
      pm25: slice[j]?.pm25 ?? null,
      pm10: slice[j]?.pm10 ?? null,
    }));

    const valid = samples.map((s) => s.aqi).filter((v): v is number => v != null);
    const aqiExposure = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;

    return { route, samples, aqiExposure, id: `route-${i}` };
  });

  const scored = pollutionRouteScorer(
    enriched.map((e) => ({
      id: e.id,
      distanceMeters: e.route.distanceMeters,
      durationSeconds: e.route.durationSeconds,
      aqiExposure: e.aqiExposure,
    })),
    weights,
  );

  const routes: AnalyzedRoute[] = enriched.map((e, i) => {
    const s = scored.find((x) => x.id === e.id)!;
    return {
      id: e.id,
      name: ROUTE_NAMES[i] ?? `Route ${i + 1}`,
      distanceMeters: e.route.distanceMeters,
      durationSeconds: e.route.durationSeconds,
      geometry: e.route.geometry,
      samples: e.samples,
      aqiExposure: e.aqiExposure,
      pollutionCategory: s.pollutionCategory,
      breakdown: s.breakdown,
      recommended: s.recommended,
      explanation: s.explanation,
    };
  });

  return {
    origin,
    destination,
    travelMode,
    routes,
    airQualityUnavailable: airQualityUnavailable || routes.every((r) => r.aqiExposure == null),
    airQualityUpdatedAt,
  };
}