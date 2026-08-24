/** Builds the plain-text briefing the AI assistant receives. Browser-safe. */

import { ROAD_LABEL } from "./roads";
import { SENSITIVITY_LABEL } from "./preferences";
import type { AnalyzedRoute, RouteAnalysis } from "./types";

function km(m: number) {
  return `${(m / 1000).toFixed(1)} km`;
}
function mins(s: number) {
  return `${Math.round(s / 60)} min`;
}

function describeRoute(route: AnalyzedRoute, selectedId: string | null): string {
  const roads = route.roadComposition
    .map((r) => `${ROAD_LABEL[r.roadClass]} ${km(r.distanceMeters)} (${Math.round(r.share * 100)}%)`)
    .join(", ");
  return [
    `- ${route.name}${route.recommended ? " [EcoPath recommended]" : ""}${
      route.id === selectedId ? " [currently selected by the user]" : ""
    }`,
    `  time ${mins(route.durationSeconds)}, distance ${km(route.distanceMeters)}`,
    `  mean AQI exposure ${route.aqiExposure == null ? "unavailable" : Math.round(route.aqiExposure)} (${
      route.pollutionCategory ?? "unknown"
    }), pollution level ${route.pollutionLevel}`,
    `  estimated traffic ${route.trafficLevel}, road composition: ${roads || "unknown"}`,
    `  EcoPath score ${route.ecoScore.total}/100`,
  ].join("\n");
}

export function buildAssistantContext(
  analysis: RouteAnalysis | null,
  selectedId: string | null,
): string {
  if (!analysis) {
    return "The user has not planned a route yet. Answer general questions about pollution-aware travel and how EcoPath works.";
  }

  const prefs = analysis.preferences;
  return [
    "Current EcoPath session data:",
    `User pollution sensitivity: ${SENSITIVITY_LABEL[prefs.sensitivity]}`,
    `Prefers cleaner routes even if slower: ${prefs.preferCleaner}`,
    `Maximum acceptable extra travel time: ${
      prefs.maxExtraMinutes == null ? "no limit" : `${prefs.maxExtraMinutes} min`
    }`,
    `Trip: ${analysis.origin.label} → ${analysis.destination.label} by ${analysis.travelMode}`,
    analysis.airQualityUnavailable ? "Air-quality data is currently unavailable for this trip." : "",
    "Route alternatives:",
    ...analysis.routes.map((r) => describeRoute(r, selectedId)),
    `EcoPath recommendation summary: ${analysis.recommendationSummary}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const SUGGESTED_ROUTE_QUESTIONS = [
  "Is this route okay for me?",
  "Which route should I choose?",
  "Why is this route better?",
  "What precautions should I take?",
];

export const SUGGESTED_DASHBOARD_QUESTIONS = [
  "How can I reduce pollution exposure during my commute?",
  "Should I avoid busy roads today?",
  "Why does EcoPath recommend longer routes sometimes?",
  "What should I do if the AQI becomes high?",
];
