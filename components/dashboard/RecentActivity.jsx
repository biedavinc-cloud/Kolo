import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency, shortDate } from "@/lib/format";
import { useUI } from "@/lib/UIContext";
import { ArrowDownLeft, ArrowUpRight, Pencil } from "lucide-react";

// Table d'activité récente avec filtre inline par membre (badge).
export default function RecentActivity({ transactions, categories, accounts, members, currency }) {
  const { openEditTx } = useUI();
  const [memberFilter, setMemberFilter] = useState("all");

  const membersInTx = useMemo(() => {
    const ids = new Set(transactions.map((t) => t.profile_id).filter(Boolean));
    return members.filter((m) => ids.has(m.id));
  }, [transactions, members]);

  const rows = useMemo(() => {
    return transactions
      .filter((t) => (memberFilter === "all" ? true : t.profile_id === memberFilter))
      .slice(0, 12);
  }, [transactions, memberFilter]);

  const memberLabel = (id) => members.find((m) => m.id === id)?.full_name || "—";
  const memberInitials = (id) => {
    const m = members.find((x) => x.id === id);
    const name = m?.full_name || m?.email || "?";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Activité récente</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setMemberFilter("all")}
            className={`rounded-full px-2.5 py-1 text-xs ${memberFilter === "all" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary"}`}
          >
            Tous
          </button>
          {membersInTx.slice(0, 5).map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberFilter(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${memberFilter === m.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary"}`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                {memberInitials(m.id)}
              </span>
              <span className="hidden sm:inline">{(m.full_name || m.email || "").split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Aucune transaction. Appuyez sur <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">T</kbd> pour en ajouter une.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((t) => {
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
                    {cat?.name || "—"} · {acc?.name || "—"} · {shortDate(t.date)}
                  </div>
                </div>
                <span className="hidden sm:inline text-xs text-muted-foreground">{memberLabel(t.profile_id)}</span>
                <div className={`font-mono-nums text-sm font-semibold ${income ? "text-income" : "text-foreground"}`}>
                  {income ? "+" : "−"}{formatCurrency(t.amount, currency)}
                </div>
                <button
                  onClick={() => openEditTx(t)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-border">
        <Link to="/transactions" className="text-xs text-primary hover:underline">
          Voir toutes les transactions →
        </Link>
      </div>
    </div>
  );
}