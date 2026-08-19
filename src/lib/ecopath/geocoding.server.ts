import type { NamedPlace } from "./types";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "EcoPath/1.0 (pollution-aware route planner)";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Free-text place lookup against OpenStreetMap's Nominatim service. */
export async function geocodePlaces(query: string, limit = 5): Promise<NamedPlace[]> {
  const url = `${NOMINATIM}?format=jsonv2&limit=${limit}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Location lookup failed (${res.status})`);

  const json = (await res.json()) as NominatimResult[];
  return json.map((r) => ({
    label: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
}