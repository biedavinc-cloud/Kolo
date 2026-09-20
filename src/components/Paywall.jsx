import { db } from "@/api/client";
import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/lib/useSubscription";
import { useCheckoutPlan } from "@/lib/useCheckout";

import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import PricingPlans from "@/components/PricingPlans";
import PaymentProviderDialog from "@/components/PaymentProviderDialog";

// Écran affiché à la fin de l'essai gratuit : un vrai paiement est requis
// pour continuer (voir useCheckoutPlan — redirige vers le PSP choisi).
export default function Paywall() {
  const { user } = useAuth();
  const { subscription } = useSubscription(user);
  const { start, selecting, providers, pendingPlan, chooseProvider, cancelProviderPick } = useCheckoutPlan();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <Image src={LOGO_URL} alt="Kolo" className="h-12 w-12 rounded-xl object-cover" />
      <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">
        Votre essai gratuit de 7 jours est terminé
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Choisissez un plan pour continuer à utiliser Kolo avec votre foyer. Votre argent,
        vos budgets et vos objectifs vous attendent — tout est conservé.
      </p>

      <div className="mt-8 w-full max-w-6xl">
        <PricingPlans currentPlan={subscription?.plan} onSelect={start} selecting={selecting} />
      </div>

      <PaymentProviderDialog
        plan={pendingPlan}
        providers={providers}
        selecting={selecting}
        onChoose={chooseProvider}
        onClose={cancelProviderPick}
      />

      <button
        onClick={() => db.auth.logout()}
        className="mt-8 text-xs text-muted-foreground hover:underline"
      >
        Se déconnecter
      </button>
    </div>
  );
}
