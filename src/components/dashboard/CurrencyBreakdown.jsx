import React from "react";
import { formatCurrency } from "@/lib/format";
import { Coins } from "lucide-react";

// N'affiche rien pour un foyer mono-devise : ce résumé n'a d'intérêt que
// lorsque les comptes sont répartis sur plusieurs devises (ex. un compte au
// Cameroun en XAF, un en France en EUR, un aux USA en USD…).
export default function CurrencyBreakdown({ accounts }) {
  const byCurrency = accounts.reduce((acc, a) => {
    const c = a.currency || "EUR";
    acc[c] = (acc[c] || 0) + Number(a.balance || 0);
    return acc;
  }, {});
  const currencies = Object.keys(byCurrency);
  if (currencies.length <= 1) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Coins className="h-4 w-4" /> Répartition par devise
      </h3>
      <div className="space-y-2">
        {currencies.map((c) => (
          <div key={c} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">{c}</span>
            <span className="font-mono-nums text-sm font-semibold">{formatCurrency(byCurrency[c], c)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Le patrimoine net ci-dessus additionne tout ceci converti dans votre devise d'affichage.
      </p>
    </div>
  );
}
