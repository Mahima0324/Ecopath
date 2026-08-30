import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Leaf, MapPin, Route as RouteIcon, Trash2, Wind } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiAssistantCard } from "@/components/ecopath/AiAssistant";
import { AqiBadge } from "@/components/ecopath/AqiBadge";
import { PageShell } from "@/components/ecopath/PageShell";
import { PlaceInput } from "@/components/ecopath/PlaceInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import {
  addSavedPlace,
  deleteSavedPlace,
  deleteSavedRoute,
  getDashboardStats,
  getLocationAirQuality,
  listRouteHistory,
  listSavedPlaces,
  listSavedRoutes,
  searchPlaces,
} from "@/lib/ecopath.functions";
import { formatDistance, formatDuration } from "@/lib/ecopath/format";
import { SENSITIVITY_LABEL, sensitivityAdvice } from "@/lib/ecopath/preferences";
import type { NamedPlace } from "@/lib/ecopath/types";

const title = "Your dashboard — EcoPath";
const description = "Saved clean-air routes, recent trips and your pollution-aware travel stats.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const DASHBOARD_QUESTIONS = [
  "What's the cleanest way to commute today?",
  "Should I avoid main roads right now?",
  "How can I reduce pollution exposure during my commute?",
  "What precautions should I take today?",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const queryClient = useQueryClient();
  const { profile, preferences, displayName } = useProfile();

  const stats = useServerFn(getDashboardStats);
  const saved = useServerFn(listSavedRoutes);
  const history = useServerFn(listRouteHistory);
  const removeRoute = useServerFn(deleteSavedRoute);
  const places = useServerFn(listSavedPlaces);
  const addPlace = useServerFn(addSavedPlace);
  const removePlace = useServerFn(deleteSavedPlace);
  const geocode = useServerFn(searchPlaces);
  const locationAq = useServerFn(getLocationAirQuality);

  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => stats({ data: undefined }) });
  const savedQuery = useQuery({ queryKey: ["saved-routes"], queryFn: () => saved({ data: undefined }) });
  const historyQuery = useQuery({ queryKey: ["route-history"], queryFn: () => history({ data: undefined }) });
  const placesQuery = useQuery({ queryKey: ["saved-places"], queryFn: () => places({ data: undefined }) });

  const homePlace: NamedPlace | null = placesQuery.data?.[0]
    ? {
        label: placesQuery.data[0].address ?? placesQuery.data[0].label,
        lat: placesQuery.data[0].lat,
        lon: placesQuery.data[0].lon,
      }
    : null;
  const homeCity = profile?.home_city?.trim() || null;

  const todayAq = useQuery({
    queryKey: ["today-aq", homePlace?.lat, homePlace?.lon, homeCity],
    enabled: !!homePlace || !!homeCity,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      let place = homePlace;
      if (!place && homeCity) {
        const results = await geocode({ data: { query: homeCity } });
        place = results[0] ?? null;
      }
      if (!place) return null;
      return locationAq({ data: { place } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRoute({ data: { id } }),
    onSuccess: () => {
      toast.success("Saved route removed");
      void queryClient.invalidateQueries({ queryKey: ["saved-routes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Could not remove that route."),
  });

  const [placeLabel, setPlaceLabel] = useState("");
  const [newPlace, setNewPlace] = useState<NamedPlace | null>(null);

  const addPlaceMutation = useMutation({
    mutationFn: () => addPlace({ data: { label: placeLabel.trim(), place: newPlace! } }),
    onSuccess: () => {
      setPlaceLabel("");
      setNewPlace(null);
      toast.success("Destination saved");
      void queryClient.invalidateQueries({ queryKey: ["saved-places"] });
    },
    onError: () => toast.error("Could not save that destination."),
  });

  const removePlaceMutation = useMutation({
    mutationFn: (id: string) => removePlace({ data: { id } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["saved-places"] }),
  });

  const todayAqi = todayAq.data?.aqi ?? null;
  const assistantContext = [
    `The user is on their EcoPath dashboard. Name: ${displayName}.`,
    `Pollution sensitivity: ${SENSITIVITY_LABEL[preferences.sensitivity]}.`,
    `Prefers cleaner routes: ${preferences.preferCleaner}. Maximum acceptable extra time: ${
      preferences.maxExtraMinutes == null ? "no limit" : `${preferences.maxExtraMinutes} min`
    }.`,
    todayAq.data
      ? `Current air quality near ${todayAq.data.place.label}: AQI ${
          todayAqi == null ? "unavailable" : Math.round(todayAqi)
        }, PM2.5 ${todayAq.data.pm25 ?? "unavailable"}.`
      : "No current air-quality reading is loaded for this user.",
    `Journeys planned so far: ${statsQuery.data?.routesPlanned ?? 0}. Average AQI exposure: ${
      statsQuery.data?.averageExposure ?? "not enough data"
    }.`,
    "Give concise, practical, non-diagnostic guidance.",
  ].join("\n");

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {greeting()}, {displayName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your pollution sensitivity:{" "}
          <strong className="text-foreground">{SENSITIVITY_LABEL[preferences.sensitivity]}</strong> ·{" "}
          <Link to="/onboarding" className="text-primary hover:underline">
            update preferences
          </Link>
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="size-4 text-primary" /> Today's air quality
            </p>
            {todayAq.isPending && (homePlace || homeCity) ? (
              <Skeleton className="mt-3 h-12 w-32" />
            ) : todayAq.data ? (
              <>
                <p className="mt-2 font-display text-4xl font-bold tabular-nums">
                  {todayAqi == null ? "—" : Math.round(todayAqi)}
                </p>
                <div className="mt-2">
                  <AqiBadge aqi={todayAqi} showValue={false} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{todayAq.data.place.label}</p>
                <p className="mt-3 text-sm">{sensitivityAdvice(preferences.sensitivity, todayAqi)}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Save a destination below (or set your home city during onboarding) to see today's local air
                quality here.
              </p>
            )}
          </div>

          <AiAssistantCard
            context={assistantContext}
            suggestions={DASHBOARD_QUESTIONS}
            description="Ask about today's air quality, your commute, or how to lower your pollution exposure."
          />

        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={RouteIcon}
            label="Journeys planned"
            value={statsQuery.data?.routesPlanned}
            loading={statsQuery.isPending}
          />
          <StatCard
            icon={Bookmark}
            label="Routes saved"
            value={statsQuery.data?.routesSaved}
            loading={statsQuery.isPending}
          />
          <StatCard
            icon={Leaf}
            label="Cleaner-air choices"
            value={statsQuery.data?.lowerPollutionChosen}
            loading={statsQuery.isPending}
          />
          <StatCard
            icon={Wind}
            label="Avg. AQI exposure"
            value={statsQuery.data?.averageExposure ?? undefined}
            loading={statsQuery.isPending}
          />
        </div>

        {(statsQuery.data?.trend?.length ?? 0) > 1 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold">Pollution exposure trend</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mean AQI exposure of the route you took, most recent journeys last.
            </p>
            <Sparkline
              values={(statsQuery.data?.trend ?? []).map((t) => t.aqi).filter((v): v is number => v != null)}
            />
          </div>
        )}

        <h2 className="mt-12 font-display text-xl font-semibold">Saved destinations</h2>
        <div className="mt-4 space-y-3">
          {placesQuery.data?.map((row) => (
            <article
              key={row.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="truncate text-xs text-muted-foreground">{row.address}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${row.label}`}
                onClick={() => removePlaceMutation.mutate(row.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </article>
          ))}
          {placesQuery.data?.length === 0 && (
            <EmptyState message="No saved destinations yet — add home, college or work below." />
          )}

          <form
            className="grid gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 sm:grid-cols-[160px_1fr_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newPlace || !placeLabel.trim()) {
                toast.error("Add a name and pick a location.");
                return;
              }
              addPlaceMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="place-label" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="place-label"
                value={placeLabel}
                onChange={(e) => setPlaceLabel(e.target.value)}
                placeholder="Home"
              />
            </div>
            <PlaceInput
              id="place-location"
              label="Location"
              placeholder="Search an address"
              value={newPlace}
              onChange={setNewPlace}
            />
            <Button type="submit" disabled={addPlaceMutation.isPending}>
              Save
            </Button>
          </form>
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold">Saved routes</h2>
        <div className="mt-4 space-y-3">
          {savedQuery.isPending && <Skeleton className="h-24 w-full rounded-2xl" />}
          {savedQuery.data?.length === 0 && (
            <EmptyState message="No saved routes yet. Analyze a trip and save the option you like." />
          )}
          {savedQuery.data?.map((row) => (
            <article
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="min-w-[14rem] flex-1">
                <h3 className="font-medium">{row.label ?? "Saved route"}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {row.origin_label} → {row.destination_label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.travel_mode} · {formatDistance(row.distance_m)} · {formatDuration(row.duration_s)}
                </p>
              </div>
              <AqiBadge aqi={row.aqi_exposure} />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete saved route"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(row.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </article>
          ))}
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold">Recent journeys</h2>
        <div className="mt-4 space-y-3">
          {historyQuery.isPending && <Skeleton className="h-20 w-full rounded-2xl" />}
          {historyQuery.data?.length === 0 && (
            <EmptyState message="No trips yet — your analyzed routes will appear here." />
          )}
          {historyQuery.data?.map((row) => (
            <article
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="min-w-[14rem] flex-1">
                <p className="text-sm font-medium">
                  {row.origin_label} → {row.destination_label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()} · {row.travel_mode} ·{" "}
                  {formatDistance(row.chosen_distance_m)} · {formatDuration(row.chosen_duration_s)}
                </p>
              </div>
              {row.picked_lower_pollution && (
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
                  Chose cleaner air
                </span>
              )}
              <AqiBadge aqi={row.chosen_aqi_exposure} />
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/planner">Plan another route</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/air-quality">Check air quality</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(max - min, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 300},${40 - ((v - min) / span) * 34}`)
    .join(" ");

  return (
    <svg viewBox="0 0 300 44" className="mt-4 h-20 w-full" role="img" aria-label="AQI exposure over recent journeys">
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={(i / (values.length - 1)) * 300}
          cy={40 - ((v - min) / span) * 34}
          r="2.5"
          fill="var(--primary)"
        />
      ))}
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Leaf;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="font-display text-3xl font-bold tabular-nums">{value ?? 0}</p>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
