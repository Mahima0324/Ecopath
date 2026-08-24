/**
 * Illustrative data for the marketing hero only. It is deliberately kept out
 * of the product surfaces — the planner, dashboard and air-quality pages all
 * read live data through the service layer.
 */

export interface HeroDemoRoute {
  id: string;
  name: string;
  minutes: number;
  km: number;
  aqi: number;
  level: "LOW" | "MODERATE" | "HIGH";
  roads: string;
  recommended: boolean;
}

export const HERO_DEMO = {
  origin: "Green Park Metro",
  destination: "Riverside Campus",
  routes: [
    {
      id: "clean",
      name: "Cleanest route",
      minutes: 36,
      km: 11.8,
      aqi: 72,
      level: "LOW",
      roads: "Mostly local roads",
      recommended: true,
    },
    {
      id: "balanced",
      name: "Balanced route",
      minutes: 32,
      km: 12.1,
      aqi: 108,
      level: "MODERATE",
      roads: "Mixed roads",
      recommended: false,
    },
    {
      id: "fast",
      name: "Fastest route",
      minutes: 29,
      km: 12.6,
      aqi: 158,
      level: "HIGH",
      roads: "Major highway",
      recommended: false,
    },
  ] satisfies HeroDemoRoute[],
};
