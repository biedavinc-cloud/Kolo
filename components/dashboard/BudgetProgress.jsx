import React, { useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// Liste des budgets du mois avec barres de progression (jaune -> rouge près du plafond).
export default function BudgetProgress({ budgets, categories, transactions, currency, period }) {
  const rows = useMemo(() => {
    return budgets
      .filter((b) => b.month_year === period)
      .map((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const spent = transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              t.category_id === b.category_id &&
              t.date &&
              t.date.slice(0, 7) === period
          )
          .reduce((s, t) => s + Number(t.amount), 0);
        const pct = b.amount_limit > 0 ? Math.min(100, (spent / b.amount_limit) * 100) : 0;
        return { ...b, categoryName: cat?.name || "—", color: cat?.color || "#6D7175", spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, categories, transactions, period]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-2">Budgets du mois</h3>
        <p className="text-sm text-muted-foreground">Aucun budget défini pour ce mois.</p>
      </div>
    );
  }

  const barColor = (pct) => {
    if (pct >= 100) return "bg-expense";
    if (pct >= 80) return "bg-warning";
    return "bg-primary";
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold mb-3">Budgets du mois</h3>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{r.categoryName}</span>
              <span className="text-xs text-muted-foreground font-mono-nums">
                {formatCurrency(r.spent, currency)} / {formatCurrency(r.amount_limit, currency)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor(r.pct))}
                style={{ width: `${Math.max(2, r.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}