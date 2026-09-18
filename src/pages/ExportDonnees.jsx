import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions, useAccounts, useCategories, useMembers } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { formatCurrency, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet } from "lucide-react";

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function ExportDonnees() {
  const { user } = useAuth();
  const { currency } = useAppShell();
  const { data: transactions = [] } = useTransactions(user);
  const { data: accounts = [] } = useAccounts(user);
  const { data: categories = [] } = useCategories(user);
  const { data: members = [] } = useMembers(user);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("all");
  const [accountId, setAccountId] = useState("all");

  const catName = (id) => categories.find((c) => c.id === id)?.name || "";
  const accName = (id) => accounts.find((a) => a.id === id)?.name || "";
  const memberName = (id) => {
    const m = members.find((x) => x.id === id);
    return m?.data?.display_name || m?.full_name || m?.email || "";
  };

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .filter((t) => (type === "all" ? true : t.type === type))
      .filter((t) => (accountId === "all" ? true : t.account_id === accountId))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [transactions, from, to, type, accountId]);

  const totalIn = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);

  const download = () => {
    const header = ["Date", "Type", "Montant", "Catégorie", "Compte", "Membre", "Notes"];
    const rows = filtered.map((t) => [
      t.date,
      t.type === "income" ? "Revenu" : "Dépense",
      Number(t.amount || 0).toFixed(2).replace(".", ","),
      catName(t.category_id),
      accName(t.account_id),
      memberName(t.profile_id),
      t.notes || "",
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liyah-transactions-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Download className="h-5 w-5" /> Exporter vos données
        </h1>
        <p className="text-sm text-muted-foreground">
          Téléchargez l'historique complet de vos transactions au format CSV pour un usage externe
          (Excel, Numbers, Google Sheets…).
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Du</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Au</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
            >
              <option value="all">Tous</option>
              <option value="income">Revenus</option>
              <option value="expense">Dépenses</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Compte</Label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
            >
              <option value="all">Tous</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> transaction
            {filtered.length > 1 ? "s" : ""} · Revenus{" "}
            <span className="font-mono-nums text-income">{formatCurrency(totalIn, currency)}</span> ·
            Dépenses <span className="font-mono-nums text-expense">{formatCurrency(totalOut, currency)}</span>
          </div>
          <Button
            onClick={download}
            disabled={filtered.length === 0}
            className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Télécharger le CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Aperçu (10 premières lignes)</h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune transaction ne correspond aux filtres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Catégorie</th>
                  <th className="py-2 font-medium">Compte</th>
                  <th className="py-2 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono-nums text-xs">{t.date}</td>
                    <td className="py-2">{t.type === "income" ? "Revenu" : "Dépense"}</td>
                    <td className="py-2">{catName(t.category_id) || "—"}</td>
                    <td className="py-2">{accName(t.account_id) || "—"}</td>
                    <td
                      className={`py-2 text-right font-mono-nums ${
                        t.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatCurrency(Number(t.amount || 0), currency)}
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