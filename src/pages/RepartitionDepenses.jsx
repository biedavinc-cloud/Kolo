import React, { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions, useCategories } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { formatCurrency, monthLabel } from "@/lib/format";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const EMPTY_COLOR = "#6D7175";

export default function RepartitionDepenses() {
  const { user } = useAuth();
  const { period, currency } = useAppShell();
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);

  const data = useMemo(() => {
    const map = new Map();
    transactions
      .filter((t) => t.date?.slice(0, 7) === period && t.type === "expense")
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        const key = cat?.id || "none";
        const row = map.get(key) || {
          id: key,
          name: cat?.name || "Sans catégorie",
          color: cat?.color || EMPTY_COLOR,
          value: 0,
        };
        row.value += Number(t.amount || 0);
        map.set(key, row);
      });
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, categories, period]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <PieIcon className="h-5 w-5" /> Répartition des dépenses
        </h1>
        <p className="text-sm text-muted-foreground">
          Identifiez rapidement quels postes budgétaires consomment le plus — {monthLabel(period)}.
        </p>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <PieIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune dépense enregistrée pour ce mois. Utilisez le sélecteur de période en haut ou
            ajoutez une transaction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="relative h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                <div className="font-mono-nums text-lg font-semibold">
                  {formatCurrency(total, currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold mb-3">Détail par catégorie</h3>
            <div className="space-y-2.5">
              {data.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm flex-1 truncate">{d.name}</span>
                  <span className="text-xs text-muted-foreground font-mono-nums w-12 text-right">
                    {Math.round((d.value / total) * 100)} %
                  </span>
                  <span className="text-sm font-mono-nums w-28 text-right">
                    {formatCurrency(d.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}