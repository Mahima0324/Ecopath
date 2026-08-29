import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/ecopath/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { updateMyProfile } from "@/lib/ecopath.functions";
import {
  EXTRA_TIME_OPTIONS,
  PREFER_CLEANER_OPTIONS,
  SENSITIVITY_OPTIONS,
} from "@/lib/ecopath/preferences";
import type { PreferCleaner, SensitivityLevel } from "@/lib/ecopath/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set your pollution sensitivity — EcoPath" },
      {
        name: "description",
        content:
          "Tell EcoPath how sensitive you are to air pollution so route recommendations match your health needs.",
      },
      { property: "og:title", content: "Set your pollution sensitivity — EcoPath" },
      {
        property: "og:description",
        content: "Personalise how EcoPath balances cleaner air against travel time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, preferences, refetch } = useProfile();
  const save = useServerFn(updateMyProfile);

  const [name, setName] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(preferences.sensitivity);
  const [preferCleaner, setPreferCleaner] = useState<PreferCleaner>(preferences.preferCleaner);
  const [maxExtraMinutes, setMaxExtraMinutes] = useState<number | null>(preferences.maxExtraMinutes);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setHomeCity(profile.home_city ?? "");
    setSensitivity(preferences.sensitivity);
    setPreferCleaner(preferences.preferCleaner);
    setMaxExtraMinutes(preferences.maxExtraMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () =>
      save({
        data: {
          name: name.trim(),
          homeCity: homeCity.trim() || null,
          sensitivity,
          preferCleaner,
          maxExtraMinutes,
          onboarded: true,
        },
      }),
    onSuccess: async () => {
      await refetch();
      toast.success("Preferences saved");
      void navigate({ to: "/dashboard" });
    },
    onError: () => toast.error("Could not save your preferences. Please try again."),
  });

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Personalise your routes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          EcoPath uses these answers to decide how much cleaner air is worth to you against extra travel
          time.
        </p>

        <form
          className="mt-8 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeCity">Home city</Label>
              <Input
                id="homeCity"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="Delhi"
              />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How sensitive are you to air pollution?</legend>
            <div className="grid gap-2">
              {SENSITIVITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSensitivity(option.value)}
                  aria-pressed={sensitivity === option.value}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    sensitivity === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Would you take a longer route for cleaner air?</legend>
            <div className="flex flex-wrap gap-2">
              {PREFER_CLEANER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreferCleaner(option.value)}
                  aria-pressed={preferCleaner === option.value}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    preferCleaner === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Maximum extra time you'd accept</legend>
            <div className="flex flex-wrap gap-2">
              {EXTRA_TIME_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMaxExtraMinutes(option.value)}
                  aria-pressed={maxExtraMinutes === option.value}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    maxExtraMinutes === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save preferences
            </Button>
            <Button type="button" variant="ghost" onClick={() => void navigate({ to: "/planner" })}>
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
