import React, { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAccounts, useRecurring } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { recurringInMonth } from "@/lib/recurring";
import { formatCurrency } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

const PRIMARY = "#108548";
const HORIZON = 6;

export default function FluxTresorerie() {
  const { user } = useAuth();
  const { currency } = useAppShell();
  const { data: accounts = [] } = useAccounts(user);
  const { data: recurring = [] } = useRecurring(user);

  const startBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const series = useMemo(() => {
    const now = new Date();
    let balance = startBalance;
    const out = [];
    for (let i = 1; i <= HORIZON; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const occ = recurringInMonth(recurring, ym);
      const recIncome = occ
        .filter(({ r }) => r.type === "income")
        .reduce((s, { r }) => s + Number(r.amount || 0), 0);
      const recExpense = occ
        .filter(({ r }) => r.type === "expense")
        .reduce((s, { r }) => s + Number(r.amount || 0), 0);
      balance += recIncome - recExpense;
      out.push({
        mois: d.toLocaleDateString("fr-FR", { month: "short" }),
        Recettes: recIncome,
        Dépenses: recExpense,
        Solde: Math.round(balance * 100) / 100,
      });
    }
    return out;
  }, [startBalance, recurring]);

  const hasNegative = series.some((s) => s.Solde < 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Flux de trésorerie
        </h1>
        <p className="text-sm text-muted-foreground">
          Prévision de l'évolution du solde sur {HORIZON} mois, basée sur vos revenus et charges
          récurrents.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Solde actuel</div>
          <div className="mt-1 font-mono-nums text-lg font-semibold">
            {formatCurrency(startBalance, currency)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Solde prévisionnel à {HORIZON} mois</div>
          <div
            className={`mt-1 font-mono-nums text-lg font-semibold ${
              series.length && series[series.length - 1].Solde < 0 ? "text-expense" : "text-income"
            }`}
          >
            {series.length ? formatCurrency(series[series.length - 1].Solde, currency) : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Charges récurrentes / mois</div>
          <div className="mt-1 font-mono-nums text-lg font-semibold">
            {formatCurrency(
              recurring.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount || 0), 0),
              currency
            )}
          </div>
        </div>
      </div>

      {hasNegative && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p>
            Attention : votre solde prévisionnel devient négatif certains mois. Envisagez de réduire
            certaines charges récurrentes ou de revoir vos budgets.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-4">Solde prévisionnel</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSolde" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
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
              <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              <ReferenceLine y={0} stroke="#D72C0D" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="Solde"
                stroke={PRIMARY}
                strokeWidth={2}
                fill="url(#gSolde)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Détail mois par mois</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Mois</th>
                <th className="py-2 font-medium text-right">Recettes récurrentes</th>
                <th className="py-2 font-medium text-right">Charges récurrentes</th>
                <th className="py-2 font-medium text-right">Solde en fin de mois</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2 capitalize">{s.mois}</td>
                  <td className="py-2 text-right font-mono-nums text-income">+{formatCurrency(s.Recettes, currency)}</td>
                  <td className="py-2 text-right font-mono-nums text-expense">−{formatCurrency(s.Dépenses, currency)}</td>
                  <td className={`py-2 text-right font-mono-nums font-semibold ${s.Solde < 0 ? "text-expense" : ""}`}>
                    {formatCurrency(s.Solde, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}