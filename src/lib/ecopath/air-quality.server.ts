import type { AirQualityReading, GeoPoint, LocationAirQuality, NamedPlace } from "./types";

const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoCurrent {
  latitude: number;
  longitude: number;
  current?: {
    time?: string;
    us_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    nitrogen_dioxide?: number | null;
    ozone?: number | null;
  };
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
  const url = `${AIR_QUALITY_API}?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=UTC`;

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
      no2: entry?.current?.nitrogen_dioxide ?? null,
      o3: entry?.current?.ozone ?? null,
      measuredAt: entry?.current?.time ? `${entry.current.time}Z` : null,
    };
  });
}

interface WeatherResponse {
  current?: {
    temperature_2m?: number | null;
    wind_speed_10m?: number | null;
    relative_humidity_2m?: number | null;
  };
}

/** Air quality plus light weather context for a single named place. */
export async function fetchLocationAirQuality(place: NamedPlace): Promise<LocationAirQuality> {
  const [reading] = await fetchAirQuality([{ lat: place.lat, lon: place.lon }]);

  let weather: LocationAirQuality["weather"] = null;
  try {
    const url = `${WEATHER_API}?latitude=${place.lat.toFixed(4)}&longitude=${place.lon.toFixed(
      4,
    )}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=UTC`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = (await res.json()) as WeatherResponse;
      weather = {
        temperatureC: json.current?.temperature_2m ?? null,
        windKph: json.current?.wind_speed_10m ?? null,
        humidity: json.current?.relative_humidity_2m ?? null,
      };
    }
  } catch {
    weather = null;
  }

  return {
    place,
    lat: place.lat,
    lon: place.lon,
    aqi: reading?.aqi ?? null,
    pm25: reading?.pm25 ?? null,
    pm10: reading?.pm10 ?? null,
    no2: reading?.no2 ?? null,
    o3: reading?.o3 ?? null,
    measuredAt: reading?.measuredAt ?? null,
    weather,
  };
}
