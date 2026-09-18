import React from "react";
import { Play } from "lucide-react";
import AppleIcon from "@/components/AppleIcon";

// Motif QR décoratif (placeholder visuel fidèle au style de la carte blanche)
function QrPattern() {
  const size = 21;
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const inFinder = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
    let on;
    if (inFinder) {
      const lr = r < 7 ? r : r - 14;
      const lc = c < 7 ? c : c - 14;
      on = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
    } else {
      on = (r * 7 + c * 13 + ((r * c) % 5)) % 3 === 0;
    }
    cells.push(
      <div key={i} className={`aspect-square ${on ? "bg-gray-900" : "bg-white"}`} />
    );
  }
  return (
    <div
      className="grid h-20 w-20 shrink-0 gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-1 sm:h-24 sm:w-24"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  );
}

// Carte flottante blanche : QR code + badges des stores (comme le hero Bankin')
export default function QrCard() {
  return (
    <div className="mt-10 flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl sm:gap-5 sm:p-5">
        <QrPattern />
        <div>
          <p className="text-sm font-bold text-gray-900 sm:text-base">Téléchargez l'app Kolo</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-white">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
              <span className="text-[9px] leading-tight">
                <span className="block opacity-70">DISPONIBLE SUR</span>
                <span className="block font-semibold">Google Play</span>
              </span>
            </span>
            <span className="flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-white">
              <AppleIcon className="h-3.5 w-3.5" />
              <span className="text-[9px] leading-tight">
                <span className="block opacity-70">TÉLÉCHARGER DANS</span>
                <span className="block font-semibold">l'App Store</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}