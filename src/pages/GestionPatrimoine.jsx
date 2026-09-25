import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";
import { useAccounts, useDebts, useGoals } from "@/lib/useFinanceData";
import { useCurrencyEnv } from "@/lib/useCurrency";
import { formatCurrency, formatCurrencyRaw, convertAmount } from "@/lib/format";
import { Gem, Wallet, Landmark, PiggyBank, TrendingUp } from "lucide-react";

const ACCOUNT_TYPE_LABELS = {
  checking: "Compte courant",
  savings: "Épargne",
  cash: "Espèces",
  credit: "Crédit",
};

export default function GestionPatrimoine() {
  const { user } = useAuth();
  const { household } = useHousehold(user);
  const { displayCurrency } = useCurrencyEnv(user, household);
  const { data: accounts = [] } = useAccounts(user);
  const { data: debts = [] } = useDebts(user);
  const { data: goals = [] } = useGoals(user);

  const cur = (amount, from = "EUR") => convertAmount(Number(amount || 0), from, displayCurrency);

  const assets = accounts.reduce(
    (s, a) => s + cur(a.balance, a.currency || "EUR"),
    0
  );
  const totalDebts = debts.reduce((s, d) => s + Number(d.remaining_amount || 0), 0);
  const netWorth = assets - totalDebts;
  const savedGoals = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0);

  const cards = [
    { label: "Patrimoine net", value: netWorth, icon: Gem, tone: "text-primary" },
    { label: "Actifs (comptes)", value: assets, icon: Wallet, tone: "text-income" },
    { label: "Dettes restantes", value: totalDebts, icon: Landmark, tone: "text-expense" },
    { label: "Épargne objectifs", value: savedGoals, icon: PiggyBank, tone: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Gem className="h-5 w-5" /> Gestion du patrimoine
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de votre patrimoine net : comptes, dettes et épargne, convertis dans votre
          devise d'affichage ({displayCurrency}).
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <c.icon className={`h-4 w-4 ${c.tone}`} />
              {c.label}
            </div>
            <div className="mt-2 font-mono-nums text-lg font-semibold">{formatCurrency(c.value, displayCurrency)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-income" /> Comptes
        </h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun compte pour l'instant.</p>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_LABELS[a.type] || a.type} · {a.currency || "EUR"}
                  </div>
                </div>
                <div className="font-mono-nums text-sm font-semibold">
                  {formatCurrencyRaw(a.balance, a.currency || "EUR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-expense" /> Dettes
        </h2>
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune dette enregistrée — bravo !</p>
        ) : (
          <div className="divide-y divide-border">
            {debts.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {d.creditor || "Créancier"}
                    {d.interest_rate ? ` · ${d.interest_rate} %/an` : ""}
                    {d.monthly_payment ? ` · ${formatCurrency(d.monthly_payment, household?.currency || "EUR")}/mois` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-nums text-sm font-semibold text-expense">
                    {formatCurrency(d.remaining_amount, household?.currency || "EUR")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    sur {formatCurrency(d.initial_amount, household?.currency || "EUR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {debts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Patrimoine net = actifs de {formatCurrency(assets, displayCurrency)} − dettes de{" "}
            {formatCurrency(totalDebts, household?.currency || "EUR")}.
          </span>
        </div>
      )}
    </div>
  );
}