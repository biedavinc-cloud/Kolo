import React from "react";
import { Users, PieChart, ShieldCheck, Globe2 } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Espace familial privé",
    text: "Chaque membre accède à ses comptes tout en partageant une vision globale du foyer, avec une isolation stricte des données.",
  },
  {
    icon: PieChart,
    title: "Budgets intelligents",
    text: "Plafonds par catégorie, personnalisation mensuelle, copie vers le mois suivant et indicateurs visuels en temps réel.",
  },
  {
    icon: Globe2,
    title: "Multi-devises mondial",
    text: "Plus de 50 devises suivies — y compris toutes les devises africaines — pour les foyers qui vivent entre plusieurs pays.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité de niveau bancaire",
    text: "Isolation par foyer via des politiques RLS (Row-Level Security) : vos chiffres restent strictement confidentiels.",
  },
];

// Section fonctionnalités — grille épurée 2 colonnes
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}