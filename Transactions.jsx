const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppShell } from "@/components/Layout";
import {
  useAccounts,
  useTransactions,
  useCategories,
  useMembers,
  useInvalidateAll,
} from "@/lib/useFinanceData";
import { useUI } from "@/lib/UIContext";

import { formatCurrency, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2, Pencil } from "lucide-react";

export default function Transactions() {
  const { user } = useAuth();
  const { currency: householdCurrency } = useAppShell();
  const { openQuickAdd, openEditTx } = useUI();
  const { toast } = useToast();
  const invalidate = useInvalidateAll(user);
  const { data: accounts = [] } = useAccounts(user);
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);
  const { data: members = [] } = useMembers(user);

  const currency = householdCurrency || accounts[0]?.currency || "EUR";

  const [q, setQ] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (accountFilter === "all" ? true : t.account_id === accountFilter))
      .filter((t) => (categoryFilter === "all" ? true : t.category_id === categoryFilter))
      .filter((t) => (memberFilter === "all" ? true : t.profile_id === memberFilter))
      .filter((t) => {
        if (!q) return true;
        const cat = categories.find((c) => c.id === t.category_id)?.name || "";
        return (t.notes || "").toLowerCase().includes(q.toLowerCase()) || cat.toLowerCase().includes(q.toLowerCase());
      });
  }, [transactions, accountFilter, categoryFilter, memberFilter, q, categories]);

  const handleDelete = async (t) => {
    const acc = accounts.find((a) => a.id === t.account_id);
    const delta = t.type === "expense" ? Math.abs(Number(t.amount)) : -Math.abs(Number(t.amount));
    try {
      await db.entities.Transaction.delete(t.id);
      if (acc) {
        await db.entities.Account.update(acc.id, {
          balance: Number((Number(acc.balance || 0) + delta).toFixed(2)),
        });
      }
      invalidate();
      toast({ title: "Transaction supprimée" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const memberLabel = (id) => members.find((m) => m.id === id)?.full_name || "—";

  const selectCls = "h-9 rounded-md border border-input bg-surface px-2 text-sm";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} opération(s)</p>
        </div>
        <Button onClick={openQuickAdd} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 h-9"
          />
        </div>
        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={selectCls}>
          <option value="all">Tous les comptes</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
          <option value="all">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className={selectCls}>
          <option value="all">Tous membres</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
      </div>

      {/* Table desktop / list mobile */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Aucune transaction ne correspond aux filtres.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              const acc = accounts.find((a) => a.id === t.account_id);
              const income = t.type === "income";
              return (
                <div key={t.id} className="group flex items-center gap-3 px-4 hover:bg-secondary/40 transition-colors" style={{ minHeight: 44 }}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${income ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
                    {income ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.notes || cat?.name || (income ? "Revenu" : "Dépense")}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {cat?.name || "—"} · {acc?.name || "—"} · {shortDate(t.date)} · {memberLabel(t.profile_id)}
                    </div>
                  </div>
                  <div className={`font-mono-nums text-sm font-semibold ${income ? "text-income" : "text-foreground"}`}>
                    {income ? "+" : "−"}{formatCurrency(t.amount, currency)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditTx(t)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(t)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}