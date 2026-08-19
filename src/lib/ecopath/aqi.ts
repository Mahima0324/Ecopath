import type { PollutionCategory } from "./types";

/** US EPA AQI breakpoints, used purely for labelling a numeric AQI value. */
const CATEGORIES: { max: number; label: PollutionCategory; token: string }[] = [
  { max: 50, label: "Good", token: "aqi-good" },
  { max: 100, label: "Moderate", token: "aqi-moderate" },
  { max: 150, label: "Unhealthy for Sensitive Groups", token: "aqi-sensitive" },
  { max: 200, label: "Unhealthy", token: "aqi-unhealthy" },
  { max: 300, label: "Very Unhealthy", token: "aqi-very-unhealthy" },
  { max: Infinity, label: "Hazardous", token: "aqi-hazardous" },
];

export function aqiCategory(aqi: number | null | undefined): PollutionCategory | null {
  if (aqi == null || Number.isNaN(aqi)) return null;
  return (CATEGORIES.find((c) => aqi <= c.max) ?? CATEGORIES[CATEGORIES.length - 1]!).label;
}

/** Semantic design-token name for an AQI value (see src/styles.css). */
export function aqiToken(aqi: number | null | undefined): string {
  if (aqi == null || Number.isNaN(aqi)) return "muted";
  return (CATEGORIES.find((c) => aqi <= c.max) ?? CATEGORIES[CATEGORIES.length - 1]!).token;
}

export const AQI_CATEGORY_GUIDE: {
  label: PollutionCategory;
  range: string;
  meaning: string;
}[] = [
  { label: "Good", range: "0 – 50", meaning: "Air quality poses little or no risk." },
  { label: "Moderate", range: "51 – 100", meaning: "Acceptable, though very sensitive people may notice symptoms." },
  {
    label: "Unhealthy for Sensitive Groups",
    range: "101 – 150",
    meaning: "People with asthma, heart or lung conditions should limit prolonged exertion.",
  },
  { label: "Unhealthy", range: "151 – 200", meaning: "Everyone may begin to experience effects." },
  { label: "Very Unhealthy", range: "201 – 300", meaning: "Health alert: risk is increased for everyone." },
  { label: "Hazardous", range: "301+", meaning: "Emergency conditions; avoid outdoor exertion." },
];