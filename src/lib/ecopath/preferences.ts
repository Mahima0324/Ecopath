import type { PreferCleaner, SensitivityLevel, UserRoutePreferences } from "./types";

export const DEFAULT_PREFERENCES: UserRoutePreferences = {
  sensitivity: "moderate",
  preferCleaner: "sometimes",
  maxExtraMinutes: 15,
};

export const SENSITIVITY_OPTIONS: {
  value: SensitivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "low",
    label: "Low sensitivity",
    description: "I generally don't experience problems from air pollution.",
  },
  {
    value: "moderate",
    label: "Moderate sensitivity",
    description: "I prefer avoiding highly polluted areas when possible.",
  },
  {
    value: "high",
    label: "High sensitivity",
    description: "I am particularly sensitive to poor air quality.",
  },
  {
    value: "very_high",
    label: "Very high sensitivity",
    description: "I want EcoPath to strongly prioritise lower-pollution routes.",
  },
];

export const PREFER_CLEANER_OPTIONS: { value: PreferCleaner; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "sometimes", label: "Sometimes" },
  { value: "no", label: "No" },
];

export const EXTRA_TIME_OPTIONS: { value: number | null; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: null, label: "No limit" },
];

export const SENSITIVITY_LABEL: Record<SensitivityLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  very_high: "Very high",
};

/** Copy used across dashboard + AI prompts. */
export function sensitivityAdvice(sensitivity: SensitivityLevel, aqi: number | null): string {
  if (aqi == null) return "Air-quality data isn't available right now — plan as usual and check again later.";
  const strict = sensitivity === "high" || sensitivity === "very_high";
  if (aqi <= 50) return "Air is clean today. Any route works well for you.";
  if (aqi <= 100) {
    return strict
      ? "Air is acceptable but not clean — prefer lower-exposure routes where the detour is small."
      : "Air quality is acceptable today. Normal routes are fine.";
  }
  if (aqi <= 150) {
    return strict
      ? "Consider lower-exposure routes today and avoid long stretches beside heavy traffic."
      : "Consider a lower-exposure route if it costs you only a few minutes.";
  }
  return strict
    ? "Pollution is high. Take the cleanest route available and keep outdoor exposure short."
    : "Pollution is high today — the cleaner route is worth the extra minutes.";
}
