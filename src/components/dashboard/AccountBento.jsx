import React from "react";
import { formatCurrency } from "@/lib/format";
import { Wallet, CreditCard, Banknote, PiggyBank } from "lucide-react";

const TYPE_META = {
  checking: { label: "Courant", icon: Wallet },
  savings: { label: "Épargne", icon: PiggyBank },
  cash: { label: "Espèces", icon: Banknote },
  credit: { label: "Carte", icon: CreditCard },
};

// Bento list des soldes de comptes.
export default function AccountBento({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-2">Comptes</h3>
        <p className="text-sm text-muted-foreground">Aucun compte. Ajoutez-en depuis l'onglet Comptes.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold mb-3">Soldes des comptes</h3>
      <div className="space-y-2">
        {accounts.map((a) => {
          const meta = TYPE_META[a.type] || TYPE_META.checking;
          const neg = Number(a.balance || 0) < 0;
          return (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground">
                  <meta.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{meta.label}</div>
                </div>
              </div>
              <div className={`font-mono-nums text-sm font-semibold ${neg ? "text-expense" : "text-foreground"}`}>
                {formatCurrency(a.balance, a.currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}