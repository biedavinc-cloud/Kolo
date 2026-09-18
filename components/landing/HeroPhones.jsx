import React from "react";
import { motion } from "framer-motion";

function PhoneFrame({ children, className }) {
  return (
    <div className={`relative rounded-[2rem] border-[5px] border-gray-900 bg-white shadow-2xl ${className}`}>
      <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-gray-900/70" />
      <div className="px-3 pb-3 pt-5">{children}</div>
    </div>
  );
}

function AccountRow({ color, name, amount }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-medium text-gray-800 sm:text-[11px]">{name}</span>
      </div>
      <span className="font-mono text-[10px] font-semibold text-gray-900 sm:text-[11px]">{amount}</span>
    </div>
  );
}

// Deux téléphones flottants représentant l'app Kolo : comptes + analyse
export default function HeroPhones() {
  return (
    <div className="relative mx-auto mt-12 flex max-w-md items-end justify-center sm:max-w-xl">
      {/* Nuage blanc translucide sous les téléphones */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-20 w-[88%] -translate-x-1/2 rounded-full bg-white/30 blur-2xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-40 -rotate-6 sm:w-48"
      >
        <PhoneFrame>
          <p className="mb-2 px-1 text-[11px] font-bold text-gray-900 sm:text-xs">Mes comptes</p>
          <div className="space-y-1.5">
            <AccountRow color="#006d56" name="Compte joint" amount="12 450 €" />
            <AccountRow color="#4A90E2" name="Épargne" amount="8 920 €" />
            <AccountRow color="#f5a623" name="Espèces" amount="150 €" />
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-[9px] text-gray-400">Foyer Dupont</span>
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">
              Synchronisé
            </span>
          </div>
        </PhoneFrame>
      </motion.div>

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="relative z-20 -ml-8 w-40 rotate-6 sm:-ml-12 sm:w-48"
      >
        <PhoneFrame>
          <p className="mb-2 px-1 text-[11px] font-bold text-gray-900 sm:text-xs">Analyse</p>
          <div className="flex items-center gap-2.5 px-1">
            <div className="relative h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20"
              style={{
                background:
                  "conic-gradient(#00875a 0 40%, #f5a623 40% 65%, #4A90E2 65% 85%, #e5e7eb 85% 100%)",
              }}
            >
              <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white sm:h-10 sm:w-10" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                <span className="text-[9px] text-gray-600">Courses 40%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[9px] text-gray-600">Logement 25%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] text-gray-600">Loisirs 20%</span>
              </div>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5">
            <p className="text-[8px] text-emerald-800">Bien joué ! Budget respecté à 92% ce mois.</p>
          </div>
        </PhoneFrame>
      </motion.div>
    </div>
  );
}