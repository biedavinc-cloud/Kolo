import React from "react";
import { Smartphone, Zap } from "lucide-react";

// Carte flottante blanche : pas d'app native à télécharger (Kolo est une web
// app), donc pas de faux badges App Store / Google Play — juste ce qui est
// vrai : ça s'installe en un geste sur l'écran d'accueil, sans rien publier.
export default function InstallCard() {
  return (
    <div className="mt-10 flex justify-center px-4">
      <div className="flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-2xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2FA8]/10 text-[#0B2FA8]">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Sur votre téléphone en un geste</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Zap className="h-3 w-3 text-amber-500" /> Ajoutez Kolo à l'écran d'accueil — aucune installation
          </p>
        </div>
      </div>
    </div>
  );
}
