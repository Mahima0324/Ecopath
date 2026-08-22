import { classifyStep } from "./roads";
import type { GeoPoint, RoadSegment, TravelMode } from "./types";

/**
 * Public OSRM instances hosted by the OpenStreetMap community. Each travel
 * mode has its own routing profile / backend.
 */
const OSRM_HOSTS: Record<TravelMode, { host: string; profile: string }> = {
  driving: { host: "https://routing.openstreetmap.de/routed-car", profile: "driving" },
  cycling: { host: "https://routing.openstreetmap.de/routed-bike", profile: "bike" },
  walking: { host: "https://routing.openstreetmap.de/routed-foot", profile: "foot" },
};

export interface RawRoute {
  distanceMeters: number;
  durationSeconds: number;
  /** [lat, lon] pairs. */
  geometry: [number, number][];
  segments: RoadSegment[];
}

interface OsrmStep {
  distance: number;
  duration: number;
  name?: string;
  ref?: string;
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs?: { steps?: OsrmStep[] }[];
  }[];
}

export async function fetchRoutes(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TravelMode,
): Promise<RawRoute[]> {
  const { host, profile } = OSRM_HOSTS[mode];
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${host}/route/v1/${profile}/${coords}?alternatives=3&overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Routing service returned ${res.status}`);

  const json = (await res.json()) as OsrmResponse;
  if (json.code !== "Ok" || !json.routes?.length) return [];

  return json.routes.map((r) => {
    const steps = (r.legs ?? []).flatMap((leg) => leg.steps ?? []);
    const segments: RoadSegment[] = steps
      .filter((step) => step.distance > 0)
      .map((step) => {
        const base = {
          distanceMeters: step.distance,
          durationSeconds: step.duration,
          name: step.name?.trim() ? step.name.trim() : null,
          ref: step.ref?.trim() ? step.ref.trim() : null,
        };
        return {
          roadClass: classifyStep(base, mode),
          name: base.name,
          distanceMeters: base.distanceMeters,
          durationSeconds: base.durationSeconds,
        };
      });

    return {
      distanceMeters: r.distance,
      durationSeconds: r.duration,
      geometry: r.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
      segments,
    };
  });
}
