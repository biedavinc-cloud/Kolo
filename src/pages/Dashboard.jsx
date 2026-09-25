import React, { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppShell } from "@/components/Layout";
import { useAccounts, useTransactions, useCategories, useBudgets, useMembers } from "@/lib/useFinanceData";
import { formatCurrency, monthKey, isSameMonth, convertAmount } from "@/lib/format";
import CurrencyBreakdown from "@/components/dashboard/CurrencyBreakdown";
import MetricCard from "@/components/dashboard/MetricCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import AccountBento from "@/components/dashboard/AccountBento";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { period, currency: householdCurrency, displayCurrency } = useAppShell();
  const { data: accounts = [] } = useAccounts(user);
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);
  const { data: budgets = [] } = useBudgets(user);
  const { data: members = [] } = useMembers(user);

  const currency = displayCurrency || householdCurrency || accounts[0]?.currency || "EUR";

  // Un foyer peut avoir des comptes dans plusieurs devises (ex. un compte au
  // Cameroun en XAF, un en France en EUR, un aux USA en USD…) : chaque
  // montant doit être converti dans la devise d'affichage choisie avant
  // d'être additionné, sinon le total n'a aucun sens.
  const accountCurrency = (id) => accounts.find((a) => a.id === id)?.currency || currency;

  const stats = useMemo(() => {
    const inPeriod = transactions.filter((t) => t.date && t.date.slice(0, 7) === period);
    const income = inPeriod
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + convertAmount(Number(t.amount), accountCurrency(t.account_id), currency), 0);
    const expense = inPeriod
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + convertAmount(Number(t.amount), accountCurrency(t.account_id), currency), 0);
    const netWorth = accounts.reduce(
      (s, a) => s + convertAmount(Number(a.balance || 0), a.currency || currency, currency),
      0
    );

    // Variation du patrimoine sur le mois = revenus - dépenses
    const prevKey = (() => {
      const [y, m] = period.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return monthKey(d);
    })();
    const prevNet = transactions
      .filter((t) => t.date && t.date.slice(0, 7) === prevKey)
      .reduce(
        (s, t) =>
          s +
          (t.type === "income" ? 1 : -1) * convertAmount(Number(t.amount), accountCurrency(t.account_id), currency),
        0
      );
    const monthNet = income - expense;
    const changePct = prevNet !== 0 ? ((monthNet - prevNet) / Math.abs(prevNet)) * 100 : null;

    return { income, expense, netWorth, monthNet, changePct };
  }, [transactions, accounts, period, currency]);

  const changeLabel =
    stats.changePct === null
      ? "—"
      : `${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(1)}% vs mois précédent`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble financière du foyer</p>
      </div>

      {/* Metrics band */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Patrimoine net"
          value={formatCurrency(stats.netWorth, currency)}
          sub={changeLabel}
          icon={Wallet}
        />
        <MetricCard
          label="Revenus du mois"
          value={formatCurrency(stats.income, currency)}
          tone="income"
          icon={TrendingUp}
        />
        <MetricCard
          label="Dépenses du mois"
          value={formatCurrency(stats.expense, currency)}
          tone="expense"
          icon={TrendingDown}
        />
      </div>

      {/* Main stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ExpenseChart transactions={transactions} categories={categories} currency={currency} period={period} />
          <RecentActivity
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            members={members}
            currency={currency}
          />
        </div>
        <div className="space-y-5">
          <AccountBento accounts={accounts} />
          <CurrencyBreakdown accounts={accounts} />
          <BudgetProgress
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            currency={currency}
            period={period}
          />
        </div>
      </div>
    </div>
  );
}