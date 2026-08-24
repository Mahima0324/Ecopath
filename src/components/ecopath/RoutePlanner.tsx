import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeftRight, Bike, Car, Footprints, Loader2, Navigation, Wind } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { analyzeRoute, recordRouteHistory, saveRoute } from "@/lib/ecopath.functions";
import { buildAssistantContext, SUGGESTED_ROUTE_QUESTIONS } from "@/lib/ecopath/assistant-context";
import { SENSITIVITY_LABEL } from "@/lib/ecopath/preferences";
import { ROAD_LABEL } from "@/lib/ecopath/roads";
import { formatDistance, formatDuration } from "@/lib/ecopath/format";
import type { AnalyzedRoute, NamedPlace, RouteAnalysis, TravelMode } from "@/lib/ecopath/types";
import { cn } from "@/lib/utils";
import { AiAssistantCard } from "./AiAssistant";
import { EcoScoreCard } from "./EcoScoreCard";
import { PlaceInput } from "./PlaceInput";
import { RoadCompositionBar } from "./RoadCompositionBar";
import { RouteCard } from "./RouteCard";
import { RouteComparison } from "./RouteComparison";

const RouteMap = lazy(() => import("./RouteMap"));

const MODES: { value: TravelMode; label: string; icon: typeof Car }[] = [
  { value: "walking", label: "Walking", icon: Footprints },
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "driving", label: "Driving", icon: Car },
];

function MapFallback({ message }: { message: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-surface px-6 text-center">
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function RoutePlanner({
  initial,
}: {
  initial?: { origin: NamedPlace; destination: NamedPlace; travelMode: TravelMode };
}) {
  const { user } = useAuth();
  const { preferences, profile } = useProfile();
  const analyze = useServerFn(analyzeRoute);
  const logHistory = useServerFn(recordRouteHistory);
  const persistRoute = useServerFn(saveRoute);

  const [origin, setOrigin] = useState<NamedPlace | null>(initial?.origin ?? null);
  const [destination, setDestination] = useState<NamedPlace | null>(initial?.destination ?? null);
  const [travelMode, setTravelMode] = useState<TravelMode>(initial?.travelMode ?? "driving");
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async (input: { origin: NamedPlace; destination: NamedPlace; travelMode: TravelMode }) =>
      analyze({ data: { ...input, preferences } }),
    onSuccess: (result) => {
      setAnalysis(result);
      setSavedIds([]);
      const recommended = result.routes.find((r) => r.recommended) ?? result.routes[0];
      setSelectedId(recommended?.id ?? "");

      if (user && recommended) {
        const fastest = [...result.routes].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
        void logHistory({
          data: {
            origin: result.origin,
            destination: result.destination,
            travelMode: result.travelMode,
            alternativesCount: result.routes.length,
            chosenDistanceM: recommended.distanceMeters,
            chosenDurationS: recommended.durationSeconds,
            chosenAqiExposure: recommended.aqiExposure,
            chosenPollutionCategory: recommended.pollutionCategory,
            chosenRouteKind: recommended.kind,
            ecoScore: recommended.ecoScore.total,
            pickedLowerPollution:
              !!fastest &&
              fastest.id !== recommended.id &&
              recommended.aqiExposure != null &&
              fastest.aqiExposure != null &&
              recommended.aqiExposure < fastest.aqiExposure,
          },
        }).catch(() => undefined);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (route: AnalyzedRoute) => {
      if (!analysis) throw new Error("Nothing to save");
      return persistRoute({
        data: {
          label: `${route.name} · ${analysis.origin.label.split(",")[0]} → ${analysis.destination.label.split(",")[0]}`,
          origin: analysis.origin,
          destination: analysis.destination,
          travelMode: analysis.travelMode,
          distanceM: route.distanceMeters,
          durationS: route.durationSeconds,
          aqiExposure: route.aqiExposure,
          pollutionCategory: route.pollutionCategory,
          overallScore: route.ecoScore.total,
        },
      });
    },
    onSuccess: (_data, route) => {
      setSavedIds((ids) => [...ids, route.id]);
      toast.success("Route saved to your dashboard");
    },
    onError: () => toast.error("Could not save this route. Please try again."),
  });

  useEffect(() => {
    if (initial && !analysis && !mutation.isPending) mutation.mutate(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!origin || !destination) {
      toast.error("Choose both a starting point and a destination.");
      return;
    }
    mutation.mutate({ origin, destination, travelMode });
  };

  const selected = analysis?.routes.find((r) => r.id === selectedId) ?? null;
  const assistantContext = buildAssistantContext(analysis, selectedId || null);

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-[1fr_auto_1fr_auto]"
      >
        <PlaceInput
          id="origin"
          label="From"
          placeholder="e.g. Connaught Place, Delhi"
          value={origin}
          onChange={setOrigin}
        />
        <div className="flex items-end justify-center pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Swap start and destination"
            onClick={swap}
            disabled={!origin && !destination}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
        <PlaceInput
          id="destination"
          label="To"
          placeholder="e.g. Lodhi Garden, Delhi"
          value={destination}
          onChange={setDestination}
        />
        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4" />}
            {mutation.isPending ? "Analyzing..." : "Find routes"}
          </Button>
        </div>

        <fieldset className="lg:col-span-4">
          <legend className="sr-only">Travel mode</legend>
          <div className="flex flex-wrap items-center gap-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const active = travelMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setTravelMode(mode.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {mode.label}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-muted-foreground">
              {profile ? (
                <>
                  Tuned for <strong className="text-foreground">{SENSITIVITY_LABEL[preferences.sensitivity]}</strong>{" "}
                  sensitivity ·{" "}
                  <Link to="/onboarding" className="text-primary hover:underline">
                    change
                  </Link>
                </>
              ) : (
                <>
                  Using balanced defaults ·{" "}
                  <Link to="/auth" search={{ mode: "signup" }} className="text-primary hover:underline">
                    personalise
                  </Link>
                </>
              )}
            </span>
          </div>
        </fieldset>
      </form>

      {mutation.isError && (
        <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">We couldn't analyze this trip</p>
            <p className="mt-1 text-muted-foreground">
              The routing service didn't respond. Check your locations and try again in a moment.
            </p>
          </div>
        </div>
      )}

      {analysis && !mutation.isPending && analysis.routes.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="font-medium">Unable to find suitable routes.</p>
          <p className="mt-1 text-muted-foreground">
            No {analysis.travelMode} route connects these two places. Try a different travel mode or nearer
            locations.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="order-2 space-y-4 lg:order-1">
          {mutation.isPending && (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm text-muted-foreground">Analyzing routes, road types and pollution...</p>
              {[0, 1].map((i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!analysis && !mutation.isPending && (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
              <Wind className="size-5 text-primary" />
              <p className="mt-3 font-medium text-foreground">No trip planned yet</p>
              <p className="mt-1">
                Enter a start and destination above. EcoPath will pull every alternative, sample live air
                quality along each one, work out the road mix, and recommend the healthiest option for you.
              </p>
            </div>
          )}

          {analysis && analysis.routes.length > 0 && !mutation.isPending && (
            <>
              {analysis.airQualityUnavailable && (
                <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                  Air-quality data is temporarily unavailable, so routes are ranked on road type, travel time
                  and distance only.
                </p>
              )}
              {analysis.routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  selected={route.id === selectedId}
                  onSelect={() => setSelectedId(route.id)}
                  onSave={user ? () => saveMutation.mutate(route) : undefined}
                  saving={saveMutation.isPending && saveMutation.variables?.id === route.id}
                  saved={savedIds.includes(route.id)}
                />
              ))}
              {!user && (
                <p className="text-center text-xs text-muted-foreground">
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="font-medium text-primary hover:underline"
                  >
                    Create an account
                  </Link>{" "}
                  to personalise recommendations and keep a history.
                </p>
              )}
            </>
          )}
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <div className="h-[340px] overflow-hidden rounded-2xl border border-border shadow-soft sm:h-[420px] lg:sticky lg:top-20 lg:h-[520px]">
            {analysis && analysis.routes.length > 0 ? (
              <Suspense fallback={<MapFallback message="Loading map..." />}>
                <RouteMap
                  origin={analysis.origin}
                  destination={analysis.destination}
                  routes={analysis.routes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </Suspense>
            ) : (
              <MapFallback
                message={
                  mutation.isPending
                    ? "Analyzing routes and pollution levels..."
                    : "Your route alternatives will appear here, coloured by pollution exposure."
                }
              />
            )}
          </div>
        </div>
      </div>

      {analysis && analysis.routes.length > 0 && !mutation.isPending && (
        <div className="space-y-6">
          <RouteComparison analysis={analysis} selectedId={selectedId} onSelect={setSelectedId} />

          {selected && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <EcoScoreCard score={selected.ecoScore} level={selected.pollutionLevel} />

              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{selected.name} breakdown</h3>
                  {analysis.airQualityUpdatedAt && (
                    <span className="text-xs text-muted-foreground">
                      Air quality updated {new Date(analysis.airQualityUpdatedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Distance" value={formatDistance(selected.distanceMeters)} />
                  <Stat label="Travel time" value={formatDuration(selected.durationSeconds)} />
                  <Stat
                    label="Mean AQI"
                    value={selected.aqiExposure == null ? "—" : String(Math.round(selected.aqiExposure))}
                  />
                  <Stat label="Traffic" value={selected.trafficLevel} />
                </div>

                <h4 className="mt-5 text-sm font-semibold">Road composition</h4>
                <RoadCompositionBar composition={selected.roadComposition} className="mt-2" />

                <p className="mt-4 rounded-xl bg-surface px-3 py-2.5 text-xs leading-relaxed text-surface-foreground">
                  {selected.roadComposition[0]?.roadClass === "highway"
                    ? "This route spends most of its distance beside a highway, where roadside pollution is typically highest."
                    : selected.roadComposition[0]?.roadClass === "main"
                      ? "This route mostly follows main roads with steady traffic and moderate roadside pollution."
                      : "This route mostly follows quieter local streets, where roadside pollution is usually lowest."}{" "}
                  {selected.explanation}
                </p>

                <h4 className="mt-5 text-sm font-semibold">Air quality sampled along the way</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[360px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="py-2 font-medium">#</th>
                        <th className="py-2 font-medium">AQI</th>
                        <th className="py-2 font-medium">PM2.5</th>
                        <th className="py-2 font-medium">PM10</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.samples.map((s, i) => (
                        <tr key={i} className="border-t border-border/70">
                          <td className="py-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 font-medium tabular-nums">
                            {s.aqi == null ? "—" : Math.round(s.aqi)}
                          </td>
                          <td className="py-2 tabular-nums">{s.pm25 == null ? "—" : `${s.pm25.toFixed(1)}`}</td>
                          <td className="py-2 tabular-nums">{s.pm10 == null ? "—" : `${s.pm10.toFixed(1)}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Segments: {selected.segments.length} manoeuvres ·{" "}
                  {selected.roadComposition
                    .map((r) => `${ROAD_LABEL[r.roadClass]} ${formatDistance(r.distanceMeters)}`)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}

          <AiAssistantCard context={assistantContext} suggestions={SUGGESTED_ROUTE_QUESTIONS} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-base font-semibold">{value}</p>
    </div>
  );
}
