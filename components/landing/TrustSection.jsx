import React from "react";
import { ShieldCheck, Users } from "lucide-react";

// Sécurité & espace famille — deux blocs rassurants
export default function TrustSection() {
  return (
    <section id="security" className="border-t border-gray-100 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 sm:px-6 md:grid-cols-2">
        <div id="family" className="rounded-2xl border border-gray-200/80 bg-white p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
            Un espace pour toute la famille
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Invitez vos proches par token d'invitation, partagez comptes et budgets, et gardez une vision
            claire des dépenses de chacun — où que vous viviez dans le monde.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
            Vos données, chiffrées et isolées
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Chaque foyer vit dans un espace strictement isolé par des politiques RLS. L'assistant IA
            analyse vos budgets sans jamais exposer vos données, et l'administration est réservée à des
            super administrateurs vérifiés.
          </p>
        </div>
      </div>
    </section>
  );
}