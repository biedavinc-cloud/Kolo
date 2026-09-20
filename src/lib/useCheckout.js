import { createCheckoutSession } from "@/api/client";
import { useState } from "react";

import { useToast } from "@/components/ui/use-toast";

// Démarre un paiement Stripe Checkout pour un plan Kolo (redirige vers Stripe)
export function useCheckoutPlan() {
  const { toast } = useToast();
  const [selecting, setSelecting] = useState(null);

  const start = async (plan) => {
    if (window.self !== window.top) {
      toast({
        title: "Paiement indisponible en aperçu",
        description:
          "Le paiement fonctionne uniquement depuis l'application publiée. Ouvrez-la dans un nouvel onglet.",
        variant: "destructive",
      });
      return;
    }
    setSelecting(plan.id);
    try {
      const res = await createCheckoutSession(plan.id);
      if (!res?.url) throw new Error("URL de paiement manquante");
      window.location.href = res.url;
    } catch (e) {
      toast({ title: "Paiement impossible", description: e.message, variant: "destructive" });
    } finally {
      setSelecting(null);
    }
  };

  return { start, selecting };
}