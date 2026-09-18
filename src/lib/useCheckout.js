const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

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
      const res = await db.functions.invoke("stripeCheckout", {
        plan: plan.id,
        origin: window.location.origin,
      });
      if (!res.data?.url) throw new Error("URL de paiement manquante");
      window.location.href = res.data.url;
    } catch (e) {
      toast({ title: "Paiement impossible", description: e.message, variant: "destructive" });
    } finally {
      setSelecting(null);
    }
  };

  return { start, selecting };
}