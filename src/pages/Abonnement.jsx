import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/lib/useSubscription";
import { useCheckoutPlan } from "@/lib/useCheckout";
import { getHouseholdId } from "@/lib/useHousehold";
import { useQueryClient } from "@tanstack/react-query";
import PricingPlans from "@/components/PricingPlans";
import PaymentProviderDialog from "@/components/PaymentProviderDialog";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Sparkles, AlertTriangle } from "lucide-react";

// Abonnement du foyer : sélection du plan puis paiement (multi-PSP)
export default function Abonnement() {
  const { user } = useAuth();
  const { subscription, isTrial, isExpired, daysLeft, plan } = useSubscription(user);
  const { start, selecting, providers, pendingPlan, chooseProvider, cancelProviderPick } = useCheckoutPlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Retour de Stripe Checkout (succès / annulation)
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("checkout");
    if (status === "success") {
      queryClient.invalidateQueries({ queryKey: ["subscription", getHouseholdId(user)] });
      toast({
        title: "Paiement confirmé",
        description: "Votre plan est actif. Merci de votre confiance !",
      });
      window.history.replaceState({}, "", "/abonnement");
    } else if (status === "cancelled") {
      toast({
        title: "Paiement annulé",
        description: "Aucun montant n'a été prélevé.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/abonnement");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <CreditCard className="h-5 w-5" /> Abonnement
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez le plan de votre foyer — tous les plans incluent 7 jours d'essai gratuit.
        </p>
      </div>

      {isTrial && (
        <div className="flex items-center gap-3 rounded-lg border border-income/30 bg-income-soft p-4">
          <Sparkles className="h-5 w-5 text-income" />
          <div>
            <div className="text-sm font-medium">
              Essai gratuit actif — {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
              {daysLeft > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              Vous profitez actuellement d'un accès complet (Premium). Choisissez votre plan pour la suite.
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="flex items-center gap-3 rounded-lg border border-expense/30 bg-expense-soft p-4">
          <AlertTriangle className="h-5 w-5 text-expense" />
          <div>
            <div className="text-sm font-medium">Essai terminé</div>
            <div className="text-xs text-muted-foreground">
              Sélectionnez un plan ci-dessous pour conserver l'accès à Kolo.
            </div>
          </div>
        </div>
      )}

      {!isTrial && !isExpired && subscription && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <span className="font-medium">Plan actuel : {plan}</span>
          <span className="text-muted-foreground">
            {" "}— merci de votre confiance{subscription.period_end ? ` (valide jusqu'au ${subscription.period_end})` : ""}.
          </span>
        </div>
      )}

      <PricingPlans currentPlan={subscription?.plan} onSelect={start} selecting={selecting} />

      <PaymentProviderDialog
        plan={pendingPlan}
        providers={providers}
        selecting={selecting}
        onChoose={chooseProvider}
        onClose={cancelProviderPick}
      />
    </div>
  );
}