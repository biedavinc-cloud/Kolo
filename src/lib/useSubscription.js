import { getSubscription } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

import { getHouseholdId } from "@/lib/useHousehold";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Abonnement du foyer : essai gratuit de 7 jours, puis accès restreint au plan choisi.
// L'état fait autorité côté serveur (voir GET /api/subscription) — l'essai est
// initialisé là-bas avec des valeurs fixes, le client ne peut rien y injecter.
export function useSubscription(user) {
  const householdId = getHouseholdId(user);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", householdId],
    queryFn: getSubscription,
    enabled: !!householdId,
    staleTime: 60000,
  });

  const subscription = data?.subscription ?? null;
  const isTrial = data?.isTrial ?? false;
  const isExpired = data?.isExpired ?? false;
  const plan = data?.plan ?? "starter";
  const today = todayISO();
  const daysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end) - new Date(today)) / 86400000))
    : null;

  return { subscription, isLoading, isTrial, isExpired, daysLeft, plan };
}
