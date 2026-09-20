import React from "react";
import { Users, Lock, Eye, Server } from "lucide-react";

const SECURITY_POINTS = [
  { icon: Lock, text: "Mots de passe hachés (jamais stockés en clair)" },
  { icon: Server, text: "Isolation stricte des données, foyer par foyer" },
  { icon: Eye, text: "Aucune donnée revendue ni utilisée à des fins publicitaires" },
];

// Complémentaire de FeatureGrid : le parcours "famille" côté produit, et le
// détail concret (pas juste un mot-clé) de ce que "sécurisé" veut dire ici.
export default function TrustSection() {
  return (
    <section id="security" className="border-t border-gray-100 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:px-6 md:grid-cols-2 md:gap-6">
        <div id="family">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2FA8]/10 text-[#0B2FA8]">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
            Un espace pour toute la famille
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
            Invitez vos proches avec un simple code, partagez comptes et budgets, et gardez une
            vision claire des dépenses de chacun — où que vous viviez dans le monde.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900">
            Ce que « sécurisé » veut dire, concrètement
          </h3>
          <ul className="mt-4 space-y-3">
            {SECURITY_POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <p.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm leading-relaxed text-gray-600">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
