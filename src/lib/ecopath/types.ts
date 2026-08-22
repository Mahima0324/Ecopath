/** Shared EcoPath domain types. Browser-safe: no server-only imports. */

export type TravelMode = "walking" | "cycling" | "driving";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface NamedPlace extends GeoPoint {
  label: string;
}

/** A single air-quality sample taken at one coordinate along a route. */
export interface AirQualitySample extends GeoPoint {
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

export interface AirQualityReading extends AirQualitySample {
  no2?: number | null;
  o3?: number | null;
  /** ISO timestamp reported by the upstream provider. */
  measuredAt: string | null;
}

export interface LocationAirQuality extends AirQualityReading {
  place: NamedPlace;
  weather: {
    temperatureC: number | null;
    windKph: number | null;
    humidity: number | null;
  } | null;
}

/* ---------------------------------------------------------------- roads */

export type RoadClass = "highway" | "main" | "local";

export interface RoadSegment {
  roadClass: RoadClass;
  name: string | null;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoadShare {
  roadClass: RoadClass;
  distanceMeters: number;
  durationSeconds: number;
  /** 0–1 fraction of total route distance. */
  share: number;
}

export type TrafficLevel = "Light" | "Moderate" | "Heavy";

/* ------------------------------------------------------------- scoring */

export type PollutionLevel = "LOW" | "MODERATE" | "HIGH";

export type SensitivityLevel = "low" | "moderate" | "high" | "very_high";
export type PreferCleaner = "yes" | "sometimes" | "no";

export interface UserRoutePreferences {
  sensitivity: SensitivityLevel;
  preferCleaner: PreferCleaner;
  /** null = no limit. */
  maxExtraMinutes: number | null;
}

export interface EcoScore {
  /** 0–100, higher is better for your lungs. */
  total: number;
  airQuality: number; // of 45
  traffic: number; // of 20
  roadExposure: number; // of 20
  distance: number; // of 10
  travelTime: number; // of 10
}

export interface ScoreBreakdown {
  normalizedPollution: number;
  normalizedDuration: number;
  normalizedDistance: number;
  normalizedRoadExposure: number;
  pollutionScore: number;
  /** Weighted cost, 0 (best) – 1 (worst). */
  overallScore: number;
}

export type PollutionCategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export type RouteKind = "cleanest" | "fastest" | "balanced";

export interface AnalyzedRoute {
  id: string;
  /** Display name: "Cleanest route", "Fastest route", ... */
  name: string;
  kind: RouteKind;
  distanceMeters: number;
  durationSeconds: number;
  /** [lat, lon] pairs, ready for Leaflet. */
  geometry: [number, number][];
  segments: RoadSegment[];
  roadComposition: RoadShare[];
  /** 0–1: how much of the trip runs along high-traffic roads. */
  roadExposureIndex: number;
  trafficLevel: TrafficLevel;
  samples: AirQualitySample[];
  /** Mean AQI across evenly spaced sample points, null when unavailable. */
  aqiExposure: number | null;
  pollutionCategory: PollutionCategory | null;
  pollutionLevel: PollutionLevel;
  ecoScore: EcoScore;
  breakdown: ScoreBreakdown;
  recommended: boolean;
  /** Human-readable reason — set on every route. */
  explanation: string;
}

export interface RouteAnalysis {
  origin: NamedPlace;
  destination: NamedPlace;
  travelMode: TravelMode;
  routes: AnalyzedRoute[];
  preferences: UserRoutePreferences;
  recommendedId: string | null;
  /** Why the recommended route won, phrased for the user's sensitivity. */
  recommendationSummary: string;
  /** True when the air-quality provider could not be reached. */
  airQualityUnavailable: boolean;
  airQualityUpdatedAt: string | null;
}
