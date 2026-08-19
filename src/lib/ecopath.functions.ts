import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeRoutes } from "./ecopath/analyze.server";
import { fetchAirQuality } from "./ecopath/air-quality.server";
import { geocodePlaces } from "./ecopath/geocoding.server";

const placeSchema = z.object({
  label: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const travelModeSchema = z.enum(["walking", "cycling", "driving"]);

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

export const analyzeRoute = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ origin: placeSchema, destination: placeSchema, travelMode: travelModeSchema })
      .parse(input),
  )
  .handler(async ({ data }) => analyzeRoutes(data.origin, data.destination, data.travelMode));

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
    const [planned, saved, healthier] = await Promise.all([
      context.supabase.from("route_history").select("id", { count: "exact", head: true }),
      context.supabase.from("saved_routes").select("id", { count: "exact", head: true }),
      context.supabase
        .from("route_history")
        .select("id", { count: "exact", head: true })
        .eq("picked_lower_pollution", true),
    ]);
    return {
      routesPlanned: planned.count ?? 0,
      routesSaved: saved.count ?? 0,
      lowerPollutionChosen: healthier.count ?? 0,
    };
  });