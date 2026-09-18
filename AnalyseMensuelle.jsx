import React, { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions, useCategories } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { formatCurrency, monthLabel } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

const INCOME = "#108548";
const EXPENSE = "#D72C0D";
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function prevMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function stats(tx) {
  const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  return { income, expense, net: income - expense };
}

function Delta({ value, currency, invert }) {
  const positive = invert ? value < 0 : value > 0;
  const zero = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono-nums ${
        zero ? "text-muted-foreground" : positive ? "text-income" : "text-expense"
      }`}
    >
      {!zero &&
        (value > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
      {zero ? "=" : formatCurrency(Math.abs(value), currency)}
    </span>
  );
}

export default function AnalyseMensuelle() {
  const { user } = useAuth();
  const { period, currency } = useAppShell();
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);

  const prevPeriod = useMemo(() => prevMonthKey(period), [period]);

  const curTx = useMemo(
    () => transactions.filter((t) => t.date?.slice(0, 7) === period),
    [transactions, period]
  );
  const prevTx = useMemo(
    () => transactions.filter((t) => t.date?.slice(0, 7) === prevPeriod),
    [transactions, prevPeriod]
  );

  const cur = stats(curTx);
  const prev = stats(prevTx);

  // 12 derniers mois (jusqu'au mois sélectionné)
  const series = useMemo(() => {
    const [y, m] = period.split("-").map(Number);
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const tx = transactions.filter((t) => t.date?.slice(0, 7) === key);
      const s = stats(tx);
      out.push({ mois: MONTHS_SHORT[d.getMonth()], Revenus: s.income, Dépenses: s.expense });
    }
    return out;
  }, [transactions, period]);

  // Comparaison par catégorie (dépenses)
  const categoryRows = useMemo(() => {
    const map = new Map();
    const add = (tx, key) => {
      tx
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const name = categories.find((c) => c.id === t.category_id)?.name || "Sans catégorie";
          const row = map.get(name) || { name, cur: 0, prev: 0 };
          row[key] += Number(t.amount || 0);
          map.set(name, row);
        });
    };
    add(curTx, "cur");
    add(prevTx, "prev");
    return [...map.values()].sort((a, b) => b.cur - a.cur);
  }, [curTx, prevTx, categories]);

  const cards = [
    { label: "Revenus", value: cur.income, delta: cur.income - prev.income },
    { label: "Dépenses", value: cur.expense, delta: cur.expense - prev.expense, invert: true },
    { label: "Solde du mois", value: cur.net, delta: cur.net - prev.net },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" /> Analyse mensuelle
        </h1>
        <p className="text-sm text-muted-foreground">
          Comparez les revenus et dépenses de {monthLabel(period)} avec {monthLabel(prevPeriod)}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-mono-nums text-lg font-semibold">
              {formatCurrency(c.value, currency)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">vs mois précédent</span>
              <Delta value={c.delta} currency={currency} invert={c.invert} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-4">Tendance sur 12 mois</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 89%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v) => formatCurrency(v, currency).replace(/\u00A0.*/, "")}
              />
              <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              <Legend />
              <Bar dataKey="Revenus" fill={INCOME} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Dépenses" fill={EXPENSE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Dépenses par catégorie — {monthLabel(period)}</h3>
        {categoryRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune dépense sur ces deux mois.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Catégorie</th>
                  <th className="py-2 font-medium text-right">{monthLabel(prevPeriod)}</th>
                  <th className="py-2 font-medium text-right">{monthLabel(period)}</th>
                  <th className="py-2 font-medium text-right">Évolution</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right font-mono-nums text-muted-foreground">
                      {formatCurrency(r.prev, currency)}
                    </td>
                    <td className="py-2 text-right font-mono-nums">{formatCurrency(r.cur, currency)}</td>
                    <td className="py-2 text-right">
                      <Delta value={r.cur - r.prev} currency={currency} invert />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}