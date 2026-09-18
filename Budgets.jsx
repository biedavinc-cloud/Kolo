const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppShell } from "@/components/Layout";
import { useCategories, useBudgets, useTransactions, useInvalidateAll } from "@/lib/useFinanceData";
import { getHouseholdId } from "@/lib/useHousehold";

import { formatCurrency, monthLabel, monthKey } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, Copy } from "lucide-react";

function BudgetForm({ categories, initial, onSubmit, saving }) {
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [amountLimit, setAmountLimit] = useState(initial ? String(initial.amount_limit) : "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          category_id: categoryId,
          amount_limit: parseFloat(amountLimit.replace(",", ".")) || 0,
        });
      }}
      className="flex flex-col gap-4 px-4 pb-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label>Catégorie</Label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" required>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Plafond mensuel</Label>
        <Input type="text" inputMode="decimal" value={amountLimit} onChange={(e) => setAmountLimit(e.target.value.replace(/[^0-9.,]/g, ""))} className="font-mono-nums" autoFocus />
      </div>
      <Button type="submit" disabled={saving} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Enregistrer" : "Définir le budget"}
      </Button>
    </form>
  );
}

export default function Budgets() {
  const { user } = useAuth();
  const { period, currency: householdCurrency } = useAppShell();
  const householdId = getHouseholdId(user);
  const { data: categories = [] } = useCategories(user);
  const { data: budgets = [] } = useBudgets(user);
  const { data: transactions = [] } = useTransactions(user);
  const invalidate = useInvalidateAll(user);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const currency = householdCurrency || "EUR";
  const expenseCats = categories.filter((c) => c.type === "expense");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const periodBudgets = budgets.filter((b) => b.month_year === period);

  const rows = periodBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category_id === b.category_id && t.date && t.date.slice(0, 7) === period)
      .reduce((s, t) => s + Number(t.amount), 0);
    const pct = b.amount_limit > 0 ? Math.min(100, (spent / b.amount_limit) * 100) : 0;
    return { ...b, categoryName: cat?.name || "—", spent, pct };
  });

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (b) => { setEditing(b); setOpen(true); };

  const handleSubmit = async (vals) => {
    if (!vals.category_id) {
      toast({ title: "Sélectionnez une catégorie", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await db.entities.Budget.update(editing.id, { ...vals });
        toast({ title: "Budget mis à jour" });
      } else {
        await db.entities.Budget.create({
          household_id: householdId,
          ...vals,
          month_year: period,
        });
        toast({ title: "Budget défini" });
      }
      invalidate();
      setOpen(false);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    await db.entities.Budget.delete(b.id);
    invalidate();
    toast({ title: "Budget supprimé" });
  };

  // Personnalisation : copie des plafonds du mois vers le mois suivant
  const copyToNext = async () => {
    const [y, m] = period.split("-").map(Number);
    const next = monthKey(new Date(y, m, 1));
    const existing = new Set(budgets.filter((b) => b.month_year === next).map((b) => b.category_id));
    const toCopy = periodBudgets.filter((b) => !existing.has(b.category_id));
    if (toCopy.length === 0) {
      toast({ title: "Rien à copier", description: `Les plafonds de ${monthLabel(next)} existent déjà.` });
      return;
    }
    try {
      await db.entities.Budget.bulkCreate(
        toCopy.map((b) => ({
          household_id: householdId,
          category_id: b.category_id,
          amount_limit: b.amount_limit,
          month_year: next,
        }))
      );
      invalidate();
      toast({ title: "Budgets copiés", description: `${toCopy.length} plafond(s) copié(s) vers ${monthLabel(next)}.` });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const barColor = (pct) => {
    if (pct >= 100) return "bg-expense";
    if (pct >= 80) return "bg-warning";
    return "bg-primary";
  };

  const formContent = <BudgetForm categories={expenseCats} initial={editing} onSubmit={handleSubmit} saving={saving} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground capitalize">Plafonds de {monthLabel(period)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rows.length > 0 && (
            <Button onClick={copyToNext} variant="outline" className="h-9">
              <Copy className="h-4 w-4 mr-1.5" /> Copier → mois suivant
            </Button>
          )}
          <Button onClick={openCreate} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1.5" /> Définir
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Total budgété : {formatCurrency(periodBudgets.reduce((s, b) => s + b.amount_limit, 0), currency)}
            </span>
            <span className="text-muted-foreground">
              Dépensé : {formatCurrency(rows.reduce((s, r) => s + r.spent, 0), currency)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                barColor(
                  (rows.reduce((s, r) => s + r.spent, 0) /
                    Math.max(1, periodBudgets.reduce((s, b) => s + b.amount_limit, 0))) *
                    100
                )
              )}
              style={{
                width: `${Math.min(
                  100,
                  (rows.reduce((s, r) => s + r.spent, 0) /
                    Math.max(1, periodBudgets.reduce((s, b) => s + b.amount_limit, 0))) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">Aucun budget pour ce mois. Définissez des plafonds par catégorie.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="group px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{r.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono-nums">
                    {formatCurrency(r.spent, currency)} / {formatCurrency(r.amount_limit, currency)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(r)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barColor(r.pct))} style={{ width: `${Math.max(2, r.pct)}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{Math.round(r.pct)}% utilisé</div>
            </div>
          ))}
        </div>
      )}

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="pb-2"><DrawerTitle>{editing ? "Modifier le budget" : "Définir un budget"}</DrawerTitle></DrawerHeader>
            <div className="overflow-y-auto">{formContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 max-w-md">
            <DialogHeader className="px-4 pt-4"><DialogTitle>{editing ? "Modifier le budget" : "Définir un budget"}</DialogTitle></DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}