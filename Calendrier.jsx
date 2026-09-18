import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions, useRecurring, useCategories } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { useUI } from "@/lib/UIContext";
import { recurringInMonth } from "@/lib/recurring";
import { formatCurrency, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Pencil,
  CalendarDays,
} from "lucide-react";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Calendrier() {
  const { user } = useAuth();
  const { period, setPeriod, currency } = useAppShell();
  const { openQuickAdd, openEditTx } = useUI();
  const { data: transactions = [] } = useTransactions(user);
  const { data: recurring = [] } = useRecurring(user);
  const { data: categories = [] } = useCategories(user);
  const [selectedDay, setSelectedDay] = useState(null);

  const [y, m] = period.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startOffset = (monthStart.getDay() + 6) % 7;
  const today = todayISO();

  const byDay = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.date?.slice(0, 7) === period)
      .forEach((t) => {
        const d = Number(t.date.slice(8, 10));
        if (!map[d]) map[d] = { income: 0, expense: 0, items: [] };
        map[d][t.type] += Number(t.amount || 0);
        map[d].items.push(t);
      });
    return map;
  }, [transactions, period]);

  const recByDay = useMemo(() => {
    const map = {};
    recurringInMonth(recurring, period).forEach(({ r, date }) => {
      const d = date.getDate();
      if (!map[d]) map[d] = [];
      map[d].push(r);
    });
    return map;
  }, [recurring, period]);

  const monthOccurrences = useMemo(
    () =>
      recurringInMonth(recurring, period).sort((a, b) => a.date - b.date),
    [recurring, period]
  );

  const shift = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name || "Sans catégorie";

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selISO = selectedDay ? `${period}-${String(selectedDay).padStart(2, "0")}` : null;
  const selDay = selectedDay ? byDay[selectedDay] : null;
  const selRec = selectedDay ? recByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Calendrier financier
          </h1>
          <p className="text-sm text-muted-foreground">
            Transactions passées et paiements récurrents à venir du mois.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} className="bg-surface min-h-[84px]" />;
            const info = byDay[d];
            const recs = recByDay[d] || [];
            const isToday = `${period}-${String(d).padStart(2, "0")}` === today;
            const isSelected = selectedDay === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`text-left bg-surface min-h-[84px] p-1.5 transition-colors hover:bg-secondary/50 ${
                  isSelected ? "ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-mono-nums ${
                      isToday ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {d}
                  </span>
                  {recs.length > 0 && <Repeat className="h-3 w-3 text-muted-foreground" />}
                </div>
                {info && (
                  <div className="mt-1 space-y-0.5">
                    {info.expense > 0 && (
                      <div className="text-[11px] font-mono-nums text-expense truncate">
                        −{formatCurrency(info.expense, currency)}
                      </div>
                    )}
                    {info.income > 0 && (
                      <div className="text-[11px] font-mono-nums text-income truncate">
                        +{formatCurrency(info.income, currency)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {new Date(selISO).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <Button size="sm" variant="outline" className="h-8" onClick={openQuickAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
            </Button>
          </div>
          {selDay && selDay.items.length > 0 ? (
            <div className="space-y-1.5">
              {selDay.items.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{catName(t.category_id)}</div>
                    {t.notes && <div className="text-xs text-muted-foreground truncate">{t.notes}</div>}
                  </div>
                  <span
                    className={`font-mono-nums text-sm ${t.type === "income" ? "text-income" : "text-expense"}`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(Number(t.amount || 0), currency)}
                  </span>
                  <button
                    onClick={() => openEditTx(t)}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune transaction ce jour-là.</p>
          )}
          {selRec.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" /> Récurrences prévues
              </div>
              <div className="space-y-1.5">
                {selRec.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 truncate">{r.notes || "Récurrence"}</div>
                    <span className={`font-mono-nums ${r.type === "income" ? "text-income" : "text-expense"}`}>
                      {r.type === "income" ? "+" : "−"}
                      {formatCurrency(Number(r.amount || 0), currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Paiements récurrents du mois</h3>
        {monthOccurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune récurrence ce mois-ci.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {monthOccurrences.map(({ r, date }, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm">
                <span className="font-mono-nums text-xs text-muted-foreground w-12">
                  {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
                <span className="flex-1 truncate">{r.notes || "Récurrence"}</span>
                <span className={`font-mono-nums text-sm ${r.type === "income" ? "text-income" : "text-expense"}`}>
                  {r.type === "income" ? "+" : "−"}
                  {formatCurrency(Number(r.amount || 0), currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}