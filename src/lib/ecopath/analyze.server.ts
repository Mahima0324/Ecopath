import { fetchAirQuality } from "./air-quality.server";
import { DEFAULT_PREFERENCES } from "./preferences";
import { buildComposition, estimateTraffic, roadExposureIndex } from "./roads";
import { fetchRoutes } from "./routing.server";
import { pollutionRouteScorer } from "./scoring";
import type {
  AirQualitySample,
  AnalyzedRoute,
  NamedPlace,
  RouteAnalysis,
  TravelMode,
  UserRoutePreferences,
} from "./types";

/** How many air-quality probes to take along each route. */
const SAMPLES_PER_ROUTE = 8;

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
  preferences: UserRoutePreferences = DEFAULT_PREFERENCES,
): Promise<RouteAnalysis> {
  const raw = await fetchRoutes(origin, destination, travelMode);

  const emptyAnalysis: RouteAnalysis = {
    origin,
    destination,
    travelMode,
    routes: [],
    preferences,
    recommendedId: null,
    recommendationSummary: "",
    airQualityUnavailable: false,
    airQualityUpdatedAt: null,
  };

  if (raw.length === 0) return emptyAnalysis;

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

    const roadComposition = buildComposition(route.segments);
    const exposure = roadExposureIndex(roadComposition);

    return {
      route,
      samples,
      aqiExposure,
      roadComposition,
      roadExposureIndex: exposure,
      trafficLevel: estimateTraffic(exposure),
      id: `route-${i}`,
    };
  });

  const result = pollutionRouteScorer(
    enriched.map((e) => ({
      id: e.id,
      distanceMeters: e.route.distanceMeters,
      durationSeconds: e.route.durationSeconds,
      aqiExposure: e.aqiExposure,
      roadExposureIndex: e.roadExposureIndex,
      trafficLevel: e.trafficLevel,
      roadComposition: e.roadComposition,
    })),
    preferences,
  );

  const routes: AnalyzedRoute[] = enriched.map((e) => {
    const s = result.routes.find((x) => x.id === e.id)!;
    return {
      id: e.id,
      name: s.name,
      kind: s.kind,
      distanceMeters: e.route.distanceMeters,
      durationSeconds: e.route.durationSeconds,
      geometry: e.route.geometry,
      segments: e.route.segments,
      roadComposition: e.roadComposition,
      roadExposureIndex: e.roadExposureIndex,
      trafficLevel: e.trafficLevel,
      samples: e.samples,
      aqiExposure: e.aqiExposure,
      pollutionCategory: s.pollutionCategory,
      pollutionLevel: s.pollutionLevel,
      ecoScore: s.ecoScore,
      breakdown: s.breakdown,
      recommended: s.recommended,
      explanation: s.explanation,
    };
  });

  // Recommended first, then cleanest/balanced/fastest ordering by score.
  routes.sort((a, b) => Number(b.recommended) - Number(a.recommended) || b.ecoScore.total - a.ecoScore.total);

  return {
    origin,
    destination,
    travelMode,
    routes,
    preferences,
    recommendedId: result.recommendedId,
    recommendationSummary: result.summary,
    airQualityUnavailable: airQualityUnavailable || routes.every((r) => r.aqiExposure == null),
    airQualityUpdatedAt,
  };
}
