import React from "react";
import { Users, PieChart, ShieldCheck, Globe2 } from "lucide-react";

// Section fonctionnalités — un item mis en avant (budgets) + trois secondaires,
// pour casser la monotonie d'une grille de cartes toutes identiques.
export default function FeatureGrid() {
  return (
    <section id="features" className="border-t border-gray-100 bg-gray-50/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tout ce dont votre foyer a besoin
          </h2>
          <p className="mt-4 text-gray-500">
            Des outils puissants, d'une simplicité redoutable — conçus comme les meilleures apps fintech.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Item mis en avant : occupe toute la hauteur sur 1 colonne, fond foncé */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#111827] p-8 text-white lg:row-span-2">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight">Budgets intelligents</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                Plafonds par catégorie, personnalisation mensuelle, copie automatique vers le mois
                suivant. Kolo vous alerte avant que le budget ne déborde, pas après.
              </p>
            </div>
            <div className="mt-8 flex items-end gap-2">
              {[35, 62, 48, 80, 55, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-teal-400"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2FA8]/10 text-[#0B2FA8]">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight text-gray-900">Espace familial privé</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Chaque membre accède à ses comptes tout en partageant une vision globale du foyer,
              avec une isolation stricte des données.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Globe2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight text-gray-900">Multi-devises mondial</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Plus de 50 devises suivies — y compris toutes les devises africaines — pour les
              foyers qui vivent entre plusieurs pays.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 transition-shadow hover:shadow-md lg:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight text-gray-900">Sécurité de niveau bancaire</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              Isolation par foyer via des politiques RLS (Row-Level Security) au niveau de la base
              de données : vos chiffres restent strictement confidentiels, même de nous.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
