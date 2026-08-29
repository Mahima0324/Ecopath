import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeRoutes } from "./ecopath/analyze.server";
import { fetchAirQuality, fetchLocationAirQuality } from "./ecopath/air-quality.server";
import { askAssistant } from "./ecopath/assistant.server";
import { geocodePlaces } from "./ecopath/geocoding.server";

const placeSchema = z.object({
  label: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const travelModeSchema = z.enum(["walking", "cycling", "driving"]);

const preferencesSchema = z.object({
  sensitivity: z.enum(["low", "moderate", "high", "very_high"]),
  preferCleaner: z.enum(["yes", "sometimes", "no"]),
  maxExtraMinutes: z.number().int().min(1).max(180).nullable(),
});

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(160) }).parse(input))
  .handler(async ({ data }) => geocodePlaces(data.query));

export const getAirQuality = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).parse(input),
  )
  .handler(async ({ data }) => {
    const [reading] = await fetchAirQuality([{ lat: data.lat, lon: data.lon }]);
    return reading ?? null;
  });

export const getLocationAirQuality = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ place: placeSchema }).parse(input))
  .handler(async ({ data }) => fetchLocationAirQuality(data.place));

export const analyzeRoute = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        origin: placeSchema,
        destination: placeSchema,
        travelMode: travelModeSchema,
        preferences: preferencesSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    analyzeRoutes(data.origin, data.destination, data.travelMode, data.preferences),
  );

export const askEcoPathAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        context: z.string().max(8000),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(4000),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => askAssistant(data.context, data.messages));

/* ------------------------------------------------------------- profile */

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().max(80).optional(),
        homeCity: z.string().max(120).nullable().optional(),
        sensitivity: preferencesSchema.shape.sensitivity.optional(),
        preferCleaner: preferencesSchema.shape.preferCleaner.optional(),
        maxExtraMinutes: preferencesSchema.shape.maxExtraMinutes.optional(),
        onboarded: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch["name"] = data.name;
    if (data.homeCity !== undefined) patch["home_city"] = data.homeCity;
    if (data.sensitivity !== undefined) patch["sensitivity"] = data.sensitivity;
    if (data.preferCleaner !== undefined) patch["prefer_cleaner"] = data.preferCleaner;
    if (data.maxExtraMinutes !== undefined) patch["max_extra_minutes"] = data.maxExtraMinutes;
    if (data.onboarded !== undefined) patch["onboarded"] = data.onboarded;

    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...patch })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* -------------------------------------------------------- saved places */

export const listSavedPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_places")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const addSavedPlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ label: z.string().min(1).max(60), place: placeSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_places")
      .insert({
        user_id: context.userId,
        label: data.label,
        address: data.place.label,
        lat: data.place.lat,
        lon: data.place.lon,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSavedPlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("saved_places").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------- history */

export const recordRouteHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        origin: placeSchema,
        destination: placeSchema,
        travelMode: travelModeSchema,
        alternativesCount: z.number().int().min(1).max(10),
        chosenDistanceM: z.number().nonnegative(),
        chosenDurationS: z.number().nonnegative(),
        chosenAqiExposure: z.number().nullable(),
        chosenPollutionCategory: z.string().max(60).nullable(),
        chosenRouteKind: z.string().max(30).nullable(),
        ecoScore: z.number().nullable(),
        pickedLowerPollution: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("route_history").insert({
      user_id: context.userId,
      origin_label: data.origin.label,
      origin_lat: data.origin.lat,
      origin_lon: data.origin.lon,
      destination_label: data.destination.label,
      destination_lat: data.destination.lat,
      destination_lon: data.destination.lon,
      travel_mode: data.travelMode,
      alternatives_count: data.alternativesCount,
      chosen_distance_m: data.chosenDistanceM,
      chosen_duration_s: data.chosenDurationS,
      chosen_aqi_exposure: data.chosenAqiExposure,
      chosen_pollution_category: data.chosenPollutionCategory,
      chosen_route_kind: data.chosenRouteKind,
      eco_score: data.ecoScore,
      picked_lower_pollution: data.pickedLowerPollution,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRouteHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("route_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw new Error(error.message);
    return data;
  });

/* -------------------------------------------------------- saved routes */

export const saveRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        label: z.string().max(120).nullable(),
        origin: placeSchema,
        destination: placeSchema,
        travelMode: travelModeSchema,
        distanceM: z.number().nonnegative(),
        durationS: z.number().nonnegative(),
        aqiExposure: z.number().nullable(),
        pollutionCategory: z.string().max(60).nullable(),
        overallScore: z.number().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_routes")
      .insert({
        user_id: context.userId,
        label: data.label,
        origin_label: data.origin.label,
        origin_lat: data.origin.lat,
        origin_lon: data.origin.lon,
        destination_label: data.destination.label,
        destination_lat: data.destination.lat,
        destination_lon: data.destination.lon,
        travel_mode: data.travelMode,
        distance_m: data.distanceM,
        duration_s: data.durationS,
        aqi_exposure: data.aqiExposure,
        pollution_category: data.pollutionCategory,
        overall_score: data.overallScore,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listSavedRoutes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_routes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const deleteSavedRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("saved_routes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [planned, saved, healthier, recent] = await Promise.all([
      context.supabase.from("route_history").select("id", { count: "exact", head: true }),
      context.supabase.from("saved_routes").select("id", { count: "exact", head: true }),
      context.supabase
        .from("route_history")
        .select("id", { count: "exact", head: true })
        .eq("picked_lower_pollution", true),
      context.supabase
        .from("route_history")
        .select("created_at, chosen_aqi_exposure, eco_score")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const rows = (recent.data ?? []).slice().reverse();
    const exposures = rows
      .map((r) => r.chosen_aqi_exposure)
      .filter((v): v is number => v != null);

    return {
      routesPlanned: planned.count ?? 0,
      routesSaved: saved.count ?? 0,
      lowerPollutionChosen: healthier.count ?? 0,
      averageExposure: exposures.length
        ? Math.round(exposures.reduce((a, b) => a + b, 0) / exposures.length)
        : null,
      trend: rows.map((r) => ({
        date: r.created_at,
        aqi: r.chosen_aqi_exposure,
        ecoScore: r.eco_score,
      })),
    };
  });

/** Live air quality for a small grid of points around a location (area map). */
export const getAreaAirQuality = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        points: z
          .array(z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }))
          .min(1)
          .max(25),
      })
      .parse(input),
  )
  .handler(async ({ data }) => fetchAirQuality(data.points));
