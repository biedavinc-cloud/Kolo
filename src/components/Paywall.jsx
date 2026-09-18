import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/lib/useSubscription";

import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import PricingPlans from "@/components/PricingPlans";
import { useToast } from "@/components/ui/use-toast";

// Écran affiché à la fin de l'essai gratuit : un plan est requis pour continuer
export default function Paywall() {
  const { user } = useAuth();
  const { subscription } = useSubscription(user);
  const { toast } = useToast();
  const [selecting, setSelecting] = useState(null);

  const choose = async (p) => {
    if (!subscription || subscription.plan === p.id) return;
    setSelecting(p.id);
    try {
      await db.entities.Subscription.update(subscription.id, { plan: p.id });
      toast({
        title: `Plan ${p.name} sélectionné`,
        description:
          "L'accès complet est activé dès la finalisation du paiement par l'équipe Kolo.",
      });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSelecting(null);
    }
  };

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
        <PricingPlans currentPlan={subscription?.plan} onSelect={choose} selecting={selecting} />
      </div>

      <button
        onClick={() => db.auth.logout()}
        className="mt-8 text-xs text-muted-foreground hover:underline"
      >
        Se déconnecter
      </button>
    </div>
  );
}