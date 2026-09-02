/**
 * Illustrative content for the marketing landing page only.
 * Product surfaces (planner, dashboard, air-quality) read live data through
 * the service layer — nothing here is used to render real results.
 */

import { HERO_DEMO } from "./demo";

export const LANDING_ROUTES = HERO_DEMO.routes;
export const LANDING_TRIP = { origin: HERO_DEMO.origin, destination: HERO_DEMO.destination };

export const LANDING_STATS = [
  { value: 3, suffix: "", label: "Route alternatives compared" },
  { value: 4, suffix: "+", label: "Environmental factors analysed" },
  { text: "Personalised", label: "To your sensitivity level" },
  { text: "Real-time", label: "Air-quality intelligence" },
] as const;

export const SENSITIVITY_DEMO = [
  {
    key: "low",
    label: "Low",
    pick: "Balanced route",
    detail: "32 min · AQI 108 · moderate exposure",
    note: "Time matters most, so EcoPath keeps the trip short while avoiding the worst air.",
  },
  {
    key: "moderate",
    label: "Moderate",
    pick: "Balanced route",
    detail: "32 min · AQI 108 · moderate exposure",
    note: "A small detour is worth it when the fastest road runs through heavy traffic.",
  },
  {
    key: "high",
    label: "High",
    pick: "Cleanest route",
    detail: "36 min · AQI 72 · low exposure",
    note: "Cleaner air is weighted higher, so the local-street route wins by a clear margin.",
  },
  {
    key: "very_high",
    label: "Very high",
    pick: "Cleanest route",
    detail: "36 min · AQI 72 · lowest exposure",
    note: "EcoPath prioritises the lowest predicted exposure available within your time limit.",
  },
] as const;

export const ROAD_MIX_DEMO = [
  { label: "Highway", km: 7.2, share: 0.61, token: "aqi-unhealthy" },
  { label: "Main road", km: 2.8, share: 0.24, token: "aqi-moderate" },
  { label: "Local streets", km: 1.8, share: 0.15, token: "aqi-good" },
] as const;

export const AI_SUGGESTIONS = [
  "Why this route?",
  "What precautions should I take?",
  "Is the highway route okay?",
  "Which route is healthiest for my profile?",
] as const;

export const AI_DEMO_THREAD = [
  { role: "user", text: "Should I take the fastest route?" },
  {
    role: "assistant",
    text: "The fastest route takes 29 minutes but has higher predicted pollution exposure. EcoPath recommends the 36-minute route because your profile prioritises lower exposure.",
  },
] as const;

export const THINKING_STEPS = [
  { n: "01", title: "Understand your preferences", body: "Sensitivity level, how much cleaner air is worth to you, and the extra time you'll accept." },
  { n: "02", title: "Analyse possible routes", body: "Real alternatives are generated from OpenStreetMap routing, with turn-by-turn road detail." },
  { n: "03", title: "Evaluate the environment", body: "Live air quality is sampled along every route, then combined with traffic, road type, distance and time." },
  { n: "04", title: "Recommend the route that fits you", body: "One route is highlighted — with the reasoning written out, never a black box." },
] as const;

export const RECOMMENDATION_REASONS = [
  "32% lower predicted pollution exposure",
  "Moderate traffic instead of heavy",
  "Less highway exposure along the way",
  "Only 7 additional minutes end to end",
] as const;

export const AQI_ZONES = [
  { name: "Riverside", aqi: 62, pm25: 14, pm10: 28, traffic: "Light", x: 22, y: 30 },
  { name: "Midtown", aqi: 104, pm25: 33, pm10: 61, traffic: "Moderate", x: 55, y: 55 },
  { name: "Ring Road", aqi: 167, pm25: 78, pm10: 122, traffic: "Heavy", x: 80, y: 26 },
] as const;
