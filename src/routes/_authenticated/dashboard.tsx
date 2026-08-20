import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Leaf, Route as RouteIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AqiBadge } from "@/components/ecopath/AqiBadge";
import { PageShell } from "@/components/ecopath/PageShell";
import { formatDistance, formatDuration } from "@/components/ecopath/RouteCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteSavedRoute,
  getDashboardStats,
  listRouteHistory,
  listSavedRoutes,
} from "@/lib/ecopath.functions";

const title = "Your dashboard — EcoPath";
const description = "Saved clean-air routes, recent trips and your pollution-aware travel stats.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const queryClient = useQueryClient();
  const stats = useServerFn(getDashboardStats);
  const saved = useServerFn(listSavedRoutes);
  const history = useServerFn(listRouteHistory);
  const removeRoute = useServerFn(deleteSavedRoute);

  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => stats({ data: undefined }) });
  const savedQuery = useQuery({ queryKey: ["saved-routes"], queryFn: () => saved({ data: undefined }) });
  const historyQuery = useQuery({ queryKey: ["route-history"], queryFn: () => history({ data: undefined }) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRoute({ data: { id } }),
    onSuccess: () => {
      toast.success("Saved route removed");
      void queryClient.invalidateQueries({ queryKey: ["saved-routes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Could not remove that route."),
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Your dashboard</h1>
        <p className="mt-2 text-muted-foreground">Everything you've planned and saved with EcoPath.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={RouteIcon}
            label="Routes planned"
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

        <h2 className="mt-12 font-display text-xl font-semibold">Recent trips</h2>
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

        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/planner">Plan another route</Link>
          </Button>
        </div>
      </section>
    </PageShell>
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