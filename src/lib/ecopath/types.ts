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
  /** ISO timestamp reported by the upstream provider. */
  measuredAt: string | null;
}

export interface ScoreBreakdown {
  normalizedPollution: number;
  normalizedDuration: number;
  normalizedDistance: number;
  pollutionScore: number;
  overallScore: number;
}

export type PollutionCategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export interface AnalyzedRoute {
  id: string;
  /** Display name: "Route A", "Route B", ... */
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  /** [lat, lon] pairs, ready for Leaflet. */
  geometry: [number, number][];
  samples: AirQualitySample[];
  /** Mean AQI across evenly spaced sample points, null when unavailable. */
  aqiExposure: number | null;
  pollutionCategory: PollutionCategory | null;
  breakdown: ScoreBreakdown | null;
  recommended: boolean;
  /** Human-readable reason, only set on the recommended route. */
  explanation: string | null;
}

export interface RouteAnalysis {
  origin: NamedPlace;
  destination: NamedPlace;
  travelMode: TravelMode;
  routes: AnalyzedRoute[];
  /** True when the air-quality provider could not be reached. */
  airQualityUnavailable: boolean;
  airQualityUpdatedAt: string | null;
}