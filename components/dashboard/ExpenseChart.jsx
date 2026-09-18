import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, shortDate } from "@/lib/format";

// Graphique d'évolution des dépenses par catégorie (barres lisses).
export default function ExpenseChart({ transactions, categories, currency, period }) {
  const [filter, setFilter] = useState("expense");

  const data = useMemo(() => {
    const inPeriod = transactions.filter((t) => t.date && t.date.slice(0, 7) === period && t.type === filter);
    const byCat = {};
    inPeriod.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name || "Sans catégorie";
      byCat[name] = (byCat[name] || 0) + Number(t.amount);
    });
    return Object.entries(byCat)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, categories, period, filter]);

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Répartition par catégorie</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filter === "expense" ? "Dépenses" : "Revenus"} du mois · {formatCurrency(total, currency)}
          </p>
        </div>
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          <button
            onClick={() => setFilter("expense")}
            className={`px-2.5 py-1 rounded ${filter === "expense" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground"}`}
          >
            Dépenses
          </button>
          <button
            onClick={() => setFilter("income")}
            className={`px-2.5 py-1 rounded ${filter === "income" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground"}`}
          >
            Revenus
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                fontSize: 12,
              }}
              formatter={(v) => [formatCurrency(v, currency), "Montant"]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={filter === "expense" ? "hsl(var(--expense))" : "hsl(var(--income))"} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}