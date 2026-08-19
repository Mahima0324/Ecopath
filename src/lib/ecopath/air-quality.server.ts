import type { AirQualityReading, GeoPoint } from "./types";

const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";

interface OpenMeteoCurrent {
  latitude: number;
  longitude: number;
  current?: { time?: string; us_aqi?: number | null; pm2_5?: number | null; pm10?: number | null };
}

/**
 * Fetches live air quality for a batch of coordinates in a single request.
 * Open-Meteo's air-quality endpoint is free and key-less; if it fails we
 * surface the error so the UI can show an explicit "unavailable" state
 * rather than inventing values.
 */
export async function fetchAirQuality(points: GeoPoint[]): Promise<AirQualityReading[]> {
  if (points.length === 0) return [];

  const latitude = points.map((p) => p.lat.toFixed(4)).join(",");
  const longitude = points.map((p) => p.lon.toFixed(4)).join(",");
  const url = `${AIR_QUALITY_API}?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10&timezone=UTC`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Air-quality service returned ${res.status}`);

  const json = (await res.json()) as OpenMeteoCurrent | OpenMeteoCurrent[];
  const entries = Array.isArray(json) ? json : [json];

  return points.map((point, i) => {
    const entry = entries[i];
    return {
      lat: point.lat,
      lon: point.lon,
      aqi: entry?.current?.us_aqi ?? null,
      pm25: entry?.current?.pm2_5 ?? null,
      pm10: entry?.current?.pm10 ?? null,
      measuredAt: entry?.current?.time ? `${entry.current.time}Z` : null,
    };
  });
}