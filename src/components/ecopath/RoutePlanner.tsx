import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeftRight, Bike, Car, Footprints, Loader2, Wind } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { analyzeRoute, recordRouteHistory, saveRoute } from "@/lib/ecopath.functions";
import type { AnalyzedRoute, NamedPlace, RouteAnalysis, TravelMode } from "@/lib/ecopath/types";
import { cn } from "@/lib/utils";
import { PlaceInput } from "./PlaceInput";
import { RouteCard, formatDistance, formatDuration } from "./RouteCard";

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

export function RoutePlanner({ initial }: { initial?: { origin: NamedPlace; destination: NamedPlace; travelMode: TravelMode } }) {
  const { user } = useAuth();
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
      analyze({ data: input }),
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
          overallScore: route.breakdown?.overallScore ?? null,
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

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <PlaceInput
            id="origin"
            label="Starting location"
            placeholder="e.g. Connaught Place, Delhi"
            value={origin}
            onChange={setOrigin}
          />
          <div className="flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={swap} disabled={!origin && !destination}>
              <ArrowLeftRight className="size-4" /> Swap
            </Button>
          </div>
          <PlaceInput
            id="destination"
            label="Destination"
            placeholder="e.g. Lodhi Garden, Delhi"
            value={destination}
            onChange={setDestination}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Travel mode</legend>
            <div className="grid grid-cols-3 gap-2">
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
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wind className="size-4" />}
            {mutation.isPending ? "Analyzing routes..." : "Analyze routes"}
          </Button>
        </form>

        {mutation.isPending && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm text-muted-foreground">Analyzing routes and pollution levels...</p>
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

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
              No {analysis.travelMode} route connects these two places. Try a different travel mode or
              nearer locations.
            </p>
          </div>
        )}

        {analysis && analysis.routes.length > 0 && !mutation.isPending && (
          <div className="space-y-3">
            {analysis.airQualityUnavailable && (
              <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                Air-quality data is temporarily unavailable, so routes are ranked on travel time and
                distance only.
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
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to save routes and keep a history.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="h-[420px] overflow-hidden rounded-2xl border border-border shadow-soft lg:h-[560px]">
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
                  : "Enter a start and destination to see route alternatives and the air quality along each one."
              }
            />
          )}
        </div>

        {selected && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">{selected.name} details</h3>
              {analysis?.airQualityUpdatedAt && (
                <span className="text-xs text-muted-foreground">
                  Air quality updated {new Date(analysis.airQualityUpdatedAt).toLocaleString()}
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <Stat label="Distance" value={formatDistance(selected.distanceMeters)} />
              <Stat label="Travel time" value={formatDuration(selected.durationSeconds)} />
              <Stat
                label="Mean AQI along route"
                value={selected.aqiExposure == null ? "Unavailable" : String(Math.round(selected.aqiExposure))}
              />
              <Stat label="Pollution level" value={selected.pollutionCategory ?? "Unavailable"} />
            </div>

            <h4 className="mt-6 text-sm font-semibold">Sampled points along this route</h4>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
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
                      <td className="py-2 tabular-nums">{s.pm25 == null ? "—" : `${s.pm25.toFixed(1)} µg/m³`}</td>
                      <td className="py-2 tabular-nums">{s.pm10 == null ? "—" : `${s.pm10.toFixed(1)} µg/m³`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
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