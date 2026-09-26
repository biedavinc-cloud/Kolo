import { createCheckoutSession, getCheckoutProviders } from "@/api/client";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/use-toast";

// Démarre un paiement pour un plan Kolo. Plusieurs prestataires de paiement
// (PSP) peuvent être configurés côté serveur (Stripe, Paystack, Flutterwave,
// PayUnit, Paddle) — s'il y en a plus d'un, on demande lequel utiliser avant
// de rediriger ; s'il n'y en a qu'un, on saute directement dessus.
export function useCheckoutPlan() {
  const { toast } = useToast();
  const [selecting, setSelecting] = useState(null);
  const [providers, setProviders] = useState([]);
  const [pendingPlan, setPendingPlan] = useState(null);

  useEffect(() => {
    getCheckoutProviders()
      .then((res) => setProviders(res?.providers || []))
      .catch(() => setProviders([]));
  }, []);

  const proceed = async (plan, providerId) => {
    setSelecting(plan.id);
    try {
      const res = await createCheckoutSession(plan.id, providerId);
      if (!res?.url) throw new Error("URL de paiement manquante dans la réponse du serveur");
      window.location.href = res.url;
    } catch (e) {
      toast({ title: "Paiement impossible", description: e.message || String(e), variant: "destructive" });
      // Si le serveur ne reconnaît plus ce fournisseur au moment du clic
      // (alors qu'il apparaissait dans la liste il y a un instant), on
      // rafraîchit la liste affichée pour refléter l'état réel plutôt que
      // de laisser l'utilisateur retenter avec une option qui va re-échouer.
      getCheckoutProviders()
        .then((r) => setProviders(r?.providers || []))
        .catch(() => {});
    } finally {
      setSelecting(null);
      setPendingPlan(null);
    }
  };

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
    if (providers.length === 0) {
      toast({
        title: "Paiement non disponible",
        description: "Aucun moyen de paiement n'est configuré pour le moment.",
        variant: "destructive",
      });
      return;
    }
    if (providers.length === 1) {
      await proceed(plan, providers[0].id);
      return;
    }
    setPendingPlan(plan);
  };

  return {
    start,
    selecting,
    providers,
    pendingPlan,
    chooseProvider: (providerId) => proceed(pendingPlan, providerId),
    cancelProviderPick: () => setPendingPlan(null),
  };
}
