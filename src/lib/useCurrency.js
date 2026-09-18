const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { setCurrencyContext } from "@/lib/format";

// Multi-devises : devise d'affichage personnelle de l'utilisateur + taux de
// change temps réel (base USD, rafraîchis une fois par jour). Tant que les
// taux ne sont pas chargés, l'affichage reste dans la devise d'origine.
export function useCurrencyEnv(user, household) {
  const [localCurrency, setLocalCurrency] = useState(null);

  const { data: rates = null } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      const res = await db.functions.invoke("exchangeRates", {});
      return res.data?.rates || null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const displayCurrency =
    localCurrency || user?.data?.display_currency || household?.currency || "EUR";

  // Diffuse la devise d'affichage et les taux à tous les formats monétaires
  useEffect(() => {
    setCurrencyContext({ displayCurrency, rates });
  }, [displayCurrency, rates]);

  const setDisplayCurrency = (code) => {
    setLocalCurrency(code);
    setCurrencyContext({ displayCurrency: code, rates });
    db.auth.updateMe({ display_currency: code }).catch(() => {});
  };

  return { displayCurrency, setDisplayCurrency, rates };
}