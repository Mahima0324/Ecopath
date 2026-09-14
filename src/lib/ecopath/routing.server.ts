import { classifyStep } from "./roads";
import type { GeoPoint, RoadSegment, TravelMode } from "./types";

/**
 * Public OSRM instances hosted by the OpenStreetMap community. Each travel
 * mode has its own routing profile / backend. Hosts are tried in order, so a
 * temporary block (429/403) on one mirror falls through to the next.
 */
const OSRM_HOSTS: Record<TravelMode, { host: string; profile: string }[]> = {
  driving: [
    { host: "https://router.project-osrm.org", profile: "driving" },
    { host: "https://routing.openstreetmap.de/routed-car", profile: "driving" },
  ],
  cycling: [
    { host: "https://routing.openstreetmap.de/routed-bike", profile: "bike" },
    { host: "https://router.project-osrm.org", profile: "driving" },
  ],
  walking: [
    { host: "https://routing.openstreetmap.de/routed-foot", profile: "foot" },
    { host: "https://router.project-osrm.org", profile: "driving" },
  ],
};

const USER_AGENT = "EcoPath/1.0 (pollution-aware route planner)";

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

async function requestOsrm(url: string): Promise<OsrmResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim());
    }
    return (await res.json()) as OsrmResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRoutes(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TravelMode,
): Promise<RawRoute[]> {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const failures: string[] = [];
  let json: OsrmResponse | null = null;

  for (const { host, profile } of OSRM_HOSTS[mode]) {
    const url = `${host}/route/v1/${profile}/${coords}?alternatives=3&overview=full&geometries=geojson&steps=true`;
    try {
      const candidate = await requestOsrm(url);
      if (candidate.code !== "Ok") {
        failures.push(`${host}: ${candidate.code}${candidate.message ? ` (${candidate.message})` : ""}`);
        // NoRoute / NoSegment are real answers, not outages — stop retrying.
        if (candidate.code === "NoRoute" || candidate.code === "NoSegment") return [];
        continue;
      }
      json = candidate;
      break;
    } catch (error) {
      failures.push(`${host}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!json) {
    console.error("All OSRM routing hosts failed", failures);
    throw new Error(`Routing service unavailable. Tried: ${failures.join(" | ")}`);
  }

  if (!json.routes?.length) return [];


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
