import React from "react";
import { motion } from "framer-motion";

// Silhouette de téléphone réaliste : coque noire, île dynamique, boutons latéraux.
function PhoneShell({ children, className }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -left-[2px] top-16 h-6 w-[3px] rounded-l-sm bg-gray-800/90" />
      <div className="absolute -left-[2px] top-24 h-10 w-[3px] rounded-l-sm bg-gray-800/90" />
      <div className="absolute -left-[2px] top-[9rem] h-10 w-[3px] rounded-l-sm bg-gray-800/90" />
      <div className="absolute -right-[2px] top-28 h-14 w-[3px] rounded-r-sm bg-gray-800/90" />

      <div className="rounded-[2.1rem] bg-gray-950 p-[9px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-white">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-gray-950" />
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[9px] font-semibold text-gray-900">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="13" height="8" viewBox="0 0 13 8" fill="none"><path d="M1 6.5L1 3a.5.5 0 01.5-.5h0a.5.5 0 01.5.5v3.5M4 6.5V1.5a.5.5 0 01.5-.5h0a.5.5 0 01.5.5v5M7 6.5V3a.5.5 0 01.5-.5h0a.5.5 0 01.5.5v3.5M10 6.5V.8a.5.5 0 01.5-.5h0a.5.5 0 01.5.5v5.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
        <svg width="15" height="9" viewBox="0 0 15 9" fill="none"><rect x="0.5" y="0.5" width="12" height="8" rx="2" stroke="currentColor"/><rect x="1.5" y="1.5" width="9" height="6" rx="1" fill="currentColor"/><path d="M13.5 3v3" stroke="currentColor" strokeLinecap="round"/></svg>
      </div>
    </div>
  );
}

// Téléphone 1 : dépenses par catégorie, en barres
function ExpensesPhone() {
  const bars = [
    { label: "Loyer", value: 780, max: 800, color: "#0d9488" },
    { label: "Courses", value: 420, max: 800, color: "#16a34a" },
    { label: "Transport", value: 165, max: 800, color: "#22c55e" },
    { label: "Loisirs", value: 310, max: 800, color: "#4ade80" },
    { label: "Santé", value: 95, max: 800, color: "#86efac" },
  ];
  return (
    <PhoneShell className="w-[172px] sm:w-[210px]">
      <StatusBar />
      <div className="px-3.5 pb-4 pt-2">
        <p className="text-[9px] font-medium text-gray-400">Dépenses de janvier</p>
        <p className="mt-0.5 font-mono text-lg font-bold text-gray-900 sm:text-xl">1 770,00 €</p>
        <p className="text-[9px] font-medium text-rose-500">↑ 8 % vs décembre</p>

        <div className="mt-3.5 flex h-24 items-end justify-between gap-2 sm:h-28">
          {bars.map((b, i) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.round((b.value / b.max) * 100)}%` }}
                transition={{ duration: 0.9, delay: 0.15 * i, ease: "easeOut" }}
                className="w-full max-w-[14px] rounded-t-[3px]"
                style={{ background: b.color }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-2">
          {bars.map((b) => (
            <span key={b.label} className="flex-1 truncate text-center text-[7px] font-medium text-gray-400">
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

// Téléphone 2 : évolution du solde du foyer, en courbe
function BalancePhone() {
  const points = [18200, 19100, 18700, 20400, 21600, 24850];
  const w = 128;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return [x, y];
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <PhoneShell className="w-[172px] sm:w-[210px]">
      <StatusBar />
      <div className="px-3.5 pb-4 pt-2">
        <p className="text-[9px] font-medium text-gray-400">Solde du foyer</p>
        <p className="mt-0.5 font-mono text-lg font-bold text-gray-900 sm:text-xl">24 850,00 €</p>
        <p className="text-[9px] font-medium text-emerald-600">↑ 12 % sur 6 mois</p>

        <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full sm:h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroBalanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#heroBalanceFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.6" fill="#0d9488" />
        </svg>

        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1.5">
          <span className="text-[8px] font-medium text-emerald-800">Objectif épargne</span>
          <span className="font-mono text-[9px] font-bold text-emerald-800">68 %</span>
        </div>
      </div>
    </PhoneShell>
  );
}

// Deux téléphones flottants représentant l'app Kolo : dépenses + solde
export default function HeroPhones() {
  return (
    <div className="relative mx-auto mt-12 flex max-w-md items-end justify-center sm:max-w-xl">
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-20 w-[88%] -translate-x-1/2 rounded-full bg-white/30 blur-2xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 -rotate-6"
      >
        <ExpensesPhone />
      </motion.div>

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="relative z-20 -ml-11 rotate-6 sm:-ml-14"
      >
        <BalancePhone />
      </motion.div>
    </div>
  );
}
