import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAuth } from "@/hooks/useAuth";
import { getMyProfile } from "@/lib/ecopath.functions";
import { DEFAULT_PREFERENCES } from "@/lib/ecopath/preferences";
import type { PreferCleaner, SensitivityLevel, UserRoutePreferences } from "@/lib/ecopath/types";

/** Loads the signed-in user's EcoPath profile and derived routing preferences. */
export function useProfile() {
  const { user } = useAuth();
  const fetchProfile = useServerFn(getMyProfile);

  const query = useQuery({
    queryKey: ["profile", user?.id ?? "anonymous"],
    queryFn: () => fetchProfile({ data: undefined }),
    enabled: !!user,
    staleTime: 60_000,
  });

  const profile = query.data ?? null;

  const preferences: UserRoutePreferences = profile
    ? {
        sensitivity: (profile.sensitivity as SensitivityLevel) ?? DEFAULT_PREFERENCES.sensitivity,
        preferCleaner: (profile.prefer_cleaner as PreferCleaner) ?? DEFAULT_PREFERENCES.preferCleaner,
        maxExtraMinutes: profile.max_extra_minutes ?? null,
      }
    : DEFAULT_PREFERENCES;

  const displayName =
    profile?.name?.trim() || user?.email?.split("@")[0] || "there";

  return {
    profile,
    preferences,
    displayName,
    onboarded: profile?.onboarded ?? false,
    isPending: query.isPending && !!user,
    refetch: query.refetch,
  };
}
