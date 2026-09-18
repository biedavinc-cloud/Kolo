import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions, useCategories } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { formatCurrency } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

const INCOME = "#108548";
const EXPENSE = "#D72C0D";
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function Card({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono-nums text-lg font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Rapports() {
  const { user } = useAuth();
  const { currency } = useAppShell();
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);

  const currentYear = String(new Date().getFullYear());
  const years = [
    ...new Set([...transactions.map((t) => t.date?.slice(0, 4)).filter(Boolean), currentYear]),
  ].sort((a, b) => b.localeCompare(a));
  const [year, setYear] = useState(currentYear);

  const yearTx = transactions.filter((t) => t.date?.startsWith(year));

  const series = MONTHS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const tx = yearTx.filter((t) => t.date?.slice(0, 7) === key);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { mois: label, Revenus: income, Dépenses: expense };
  });

  const totalIncome = series.reduce((s, r) => s + r.Revenus, 0);
  const totalExpense = series.reduce((s, r) => s + r.Dépenses, 0);
  const net = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

  const catMap = new Map();
  yearTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const name = categories.find((c) => c.id === t.category_id)?.name || "Sans catégorie";
      catMap.set(name, (catMap.get(name) || 0) + Number(t.amount || 0));
    });
  const topCategories = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const catMax = topCategories[0]?.[1] || 1;

  const tooltipFormatter = (value) => formatCurrency(value, currency);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Rapports annuels
          </h1>
          <p className="text-sm text-muted-foreground">
            Évolution des dépenses et des revenus sur toute l'année.
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="Revenus de l'année" value={formatCurrency(totalIncome, currency)} />
        <Card label="Dépenses de l'année" value={formatCurrency(totalExpense, currency)} />
        <Card
          label="Solde net"
          value={formatCurrency(net, currency)}
          sub={net >= 0 ? "Épargne de l'année" : "Déficit de l'année"}
        />
        <Card label="Taux d'épargne" value={`${savingsRate} %`} sub="Part des revenus non dépensée" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-4">Revenus vs dépenses — {year}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INCOME} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={INCOME} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={EXPENSE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 89%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v) => formatCurrency(v, currency).replace(/\u00A0.*/, "")}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Area type="monotone" dataKey="Revenus" stroke={INCOME} strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="Dépenses" stroke={EXPENSE} strokeWidth={2} fill="url(#gExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Principaux postes de dépenses — {year}</h3>
        {topCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune dépense enregistrée cette année.</p>
        ) : (
          <div className="space-y-2.5">
            {topCategories.map(([name, amount]) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{name}</span>
                  <span className="font-mono-nums text-muted-foreground">{formatCurrency(amount, currency)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(amount / catMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}