import React from "react";

// Aperçu produit façon Stripe : dashboard sombre, chiffres tabulaires
export default function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl px-1 sm:mt-20">
      <div className="pointer-events-none absolute -inset-x-6 -top-10 h-40 bg-gradient-to-b from-gray-100 to-transparent" />
      <div className="relative rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl shadow-gray-900/5 sm:p-2.5">
        <div className="rounded-xl border border-gray-800/10 bg-gray-950 p-4 text-left sm:p-6">
          {/* Barre de fenêtre */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-[11px] text-gray-500">kolo.app/dashboard</span>
            </div>
            <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 sm:inline">
              Foyer actif
            </span>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3 sm:gap-4 sm:py-5">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-medium text-gray-400">Solde total du foyer</p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-white sm:text-2xl">24 850,00 €</p>
              <p className="mt-1 text-[11px] text-emerald-400">↑ +12 % ce mois</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-medium text-gray-400">Revenus du mois</p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-white sm:text-2xl">4 320,00 €</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-medium text-gray-400">Dépenses du mois</p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-gray-300 sm:text-2xl">1 940,00 €</p>
            </div>
          </div>

          {/* Budgets */}
          <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 sm:gap-4 sm:pt-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Courses</span>
                <span className="font-mono text-gray-300">420 / 600 €</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Loisirs</span>
                <span className="font-mono text-gray-300">185 / 200 €</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}