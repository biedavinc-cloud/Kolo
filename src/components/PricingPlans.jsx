import React from "react";
import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Tableau premium des plans Kolo — tous avec 7 jours d'essai gratuit
export default function PricingPlans({ currentPlan, onSelect, selecting }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((p) => {
          const popular = !!p.popular;
          const isCurrent = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 transition-all duration-300",
                popular
                  ? "bg-[#111827] text-white border-[#111827] shadow-2xl scale-[1.02] z-10"
                  : "bg-white dark:bg-card border-gray-200 dark:border-border text-gray-900 dark:text-foreground hover:shadow-lg"
              )}
            >
              {popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-md whitespace-nowrap">
                  <Sparkles className="h-3 w-3" /> Le plus populaire
                </span>
              )}

              <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
              <p className={cn("mt-1 text-sm", popular ? "text-gray-400" : "text-gray-500 dark:text-muted-foreground")}>
                {p.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight">{p.price} €</span>
                <span className={cn("text-sm", popular ? "text-gray-400" : "text-gray-500 dark:text-muted-foreground")}>
                  /mois
                </span>
              </div>

              <span
                className={cn(
                  "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
                  popular ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-income-soft dark:text-income dark:border-income/30"
                )}
              >
                <Check className="h-3 w-3" /> 7 jours gratuits
              </span>

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        popular ? "text-emerald-400" : "text-emerald-600 dark:text-income"
                      )}
                    />
                    <span className={popular ? "text-gray-200" : "text-gray-600 dark:text-muted-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              {onSelect && (
                <button
                  onClick={() => onSelect(p)}
                  disabled={isCurrent || selecting === p.id}
                  className={cn(
                    "mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    isCurrent
                      ? popular
                        ? "bg-white/10 text-gray-400 cursor-default"
                        : "bg-gray-100 text-gray-400 cursor-default dark:bg-secondary dark:text-muted-foreground"
                      : popular
                        ? "bg-white text-[#111827] hover:bg-gray-100"
                        : "bg-[#111827] text-white hover:bg-black"
                  )}
                >
                  {isCurrent
                    ? "Plan choisi"
                    : selecting === p.id
                      ? "Sélection…"
                      : "Choisir ce plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-gray-500 dark:text-muted-foreground">
        Tous les plans incluent 7 jours d'essai gratuit. Sans engagement, résiliable à tout moment.
        Après l'essai, un plan est requis pour continuer à utiliser Kolo.
      </p>
    </div>
  );
}