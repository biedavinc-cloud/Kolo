import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRecurring, useAccounts, useCategories, useInvalidateAll } from "@/lib/useFinanceData";
import { getHouseholdId } from "@/lib/useHousehold";

import { formatCurrency, shortDate, todayISO } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Loader2, Repeat, CheckCircle2 } from "lucide-react";

const FREQ = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

function advanceDate(dateStr, freq) {
  const d = new Date(dateStr);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function RecurringForm({ accounts, categories, initial, onSubmit, saving }) {
  const [accountId, setAccountId] = useState(initial?.account_id || accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [type, setType] = useState(initial?.type || "expense");
  const [frequency, setFrequency] = useState(initial?.frequency || "monthly");
  const [nextDate, setNextDate] = useState(initial?.next_date || todayISO());
  const [notes, setNotes] = useState(initial?.notes || "");

  const cats = categories.filter((c) => c.type === type);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ account_id: accountId, category_id: categoryId, amount: parseFloat(amount.replace(",", ".")) || 0, type, frequency, next_date: nextDate, notes });
      }}
      className="flex flex-col gap-4 px-4 pb-4"
    >
      <div className="grid grid-cols-2 gap-2">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategoryId(""); }}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${type === t ? (t === "expense" ? "border-expense bg-expense-soft text-expense" : "border-income bg-income-soft text-income") : "border-border bg-surface text-muted-foreground"}`}
          >
            {t === "expense" ? "Dépense" : "Revenu"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Montant</Label>
        <Input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} className="font-mono-nums" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Compte</Label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Catégorie</Label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">
            <option value="">—</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Fréquence</Label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">
            {Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Prochaine échéance</Label>
          <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Libellé</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none" placeholder="Loyer, abonnement..." />
      </div>
      <Button type="submit" disabled={saving} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Enregistrer" : "Créer la récurrence"}
      </Button>
    </form>
  );
}

export default function Recurring() {
  const { user } = useAuth();
  const householdId = getHouseholdId(user);
  const { data: recurring = [] } = useRecurring(user);
  const { data: accounts = [] } = useAccounts(user);
  const { data: categories = [] } = useCategories(user);
  const invalidate = useInvalidateAll(user);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const currency = accounts[0]?.currency || "EUR";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setOpen(true); };

  const handleSubmit = async (vals) => {
    if (!vals.amount) { toast({ title: "Montant invalide", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (editing) {
        await db.entities.RecurringTransaction.update(editing.id, vals);
        toast({ title: "Récurrence mise à jour" });
      } else {
        await db.entities.RecurringTransaction.create({ household_id: householdId, ...vals });
        toast({ title: "Récurrence créée" });
      }
      invalidate();
      setOpen(false);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    await db.entities.RecurringTransaction.delete(r.id);
    invalidate();
    toast({ title: "Récurrence supprimée" });
  };

  // Enregistre la transaction maintenant et avance l'échéance
  const handlePost = async (r) => {
    const acc = accounts.find((a) => a.id === r.account_id);
    const signed = r.type === "expense" ? -Math.abs(r.amount) : Math.abs(r.amount);
    try {
      await db.entities.Transaction.create({
        household_id: householdId,
        account_id: r.account_id,
        category_id: r.category_id || null,
        profile_id: user.id,
        amount: Math.abs(r.amount),
        type: r.type,
        date: r.next_date,
        notes: r.notes || "Récurrence",
      });
      if (acc) {
        await db.entities.Account.update(acc.id, { balance: Number((Number(acc.balance || 0) + signed).toFixed(2)) });
      }
      await db.entities.RecurringTransaction.update(r.id, { next_date: advanceDate(r.next_date, r.frequency) });
      invalidate();
      toast({ title: "Transaction enregistrée" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const formContent = <RecurringForm accounts={accounts} categories={categories} initial={editing} onSubmit={handleSubmit} saving={saving} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Récurrences</h1>
          <p className="text-sm text-muted-foreground">Charges fixes & abonnements</p>
        </div>
        <Button onClick={openCreate} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter
        </Button>
      </div>

      {recurring.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <Repeat className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucune récurrence. Ajoutez vos charges récurrentes (loyer, abonnements).</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface divide-y divide-border">
          {recurring.map((r) => {
            const cat = categories.find((c) => c.id === r.category_id);
            const acc = accounts.find((a) => a.id === r.account_id);
            const income = r.type === "income";
            return (
              <div key={r.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${income ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.notes || cat?.name || "Récurrence"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {FREQ[r.frequency]} · {acc?.name || "—"} · {cat?.name || "—"} · échéance {shortDate(r.next_date)}
                  </div>
                </div>
                <div className={`font-mono-nums text-sm font-semibold ${income ? "text-income" : "text-foreground"}`}>
                  {income ? "+" : "−"}{formatCurrency(r.amount, currency)}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handlePost(r)} title="Enregistrer maintenant" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(r)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(r)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="pb-2"><DrawerTitle>{editing ? "Modifier la récurrence" : "Nouvelle récurrence"}</DrawerTitle></DrawerHeader>
            <div className="overflow-y-auto">{formContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 max-w-md">
            <DialogHeader className="px-4 pt-4"><DialogTitle>{editing ? "Modifier la récurrence" : "Nouvelle récurrence"}</DialogTitle></DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}