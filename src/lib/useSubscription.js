import { db } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

import { getHouseholdId } from "@/lib/useHousehold";
import { TRIAL_DAYS } from "@/lib/plans";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Abonnement du foyer : essai gratuit de 7 jours, puis accès restreint au plan choisi
export function useSubscription(user) {
  const householdId = getHouseholdId(user);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", householdId],
    queryFn: async () => {
      const subs = await db.entities.Subscription.filter({ household_id: householdId });
      if (subs.length > 0) return subs[0];
      // Initialisation de l'essai gratuit à la première utilisation
      const trialEnd = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10);
      return db.entities.Subscription.create({
        household_id: householdId,
        plan: "starter",
        status: "trial",
        trial_end: trialEnd,
      });
    },
    enabled: !!householdId,
    staleTime: 60000,
  });

  const today = todayISO();
  const isTrial = subscription?.status === "trial" && (!subscription?.trial_end || subscription.trial_end >= today);
  const isExpired =
    !!subscription &&
    (subscription.status === "expired" ||
      (subscription.status === "trial" && subscription.trial_end && subscription.trial_end < today));
  const daysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end) - new Date(today)) / 86400000))
    : null;
  // Pendant l'essai : accès complet (Premium). Ensuite : accès selon le plan choisi.
  const plan = isTrial ? "premium" : subscription?.plan || "starter";

  return { subscription, isLoading, isTrial, isExpired, daysLeft, plan };
}