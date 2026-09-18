const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUI } from "@/lib/UIContext";
import { useAccounts, useCategories, useInvalidateAll } from "@/lib/useFinanceData";
import { useAuth } from "@/lib/AuthContext";

import { todayISO } from "@/lib/format";
import { logHouseholdAction } from "@/lib/audit";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

const TYPE_TABS = [
  { key: "expense", label: "Dépense", icon: ArrowDownLeft, color: "expense" },
  { key: "income", label: "Revenu", icon: ArrowUpRight, color: "income" },
];

export default function QuickAddTransaction() {
  const { user } = useAuth();
  const { quickAddOpen, editingTx, closeQuickAdd } = useUI();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const invalidate = useInvalidateAll(user);
  const { data: accounts = [] } = useAccounts(user);
  const { data: categories = [] } = useCategories(user);

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  // Saisie directe d'une nouvelle catégorie depuis la transaction
  const [newCat, setNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);

  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );
  const incomeCats = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );
  const visibleCats = type === "expense" ? expenseCats : incomeCats;

  useEffect(() => {
    if (!quickAddOpen) return;
    if (editingTx) {
      setType(editingTx.type || "expense");
      setAmount(String(editingTx.amount || ""));
      setAccountId(editingTx.account_id || "");
      setCategoryId(editingTx.category_id || "");
      setDate(editingTx.date || todayISO());
      setNotes(editingTx.notes || "");
    } else {
      setType("expense");
      setAmount("");
      setAccountId(accounts[0]?.id || "");
      setCategoryId("");
      setNewCat(false);
      setNewCatName("");
      setDate(todayISO());
      setNotes("");
    }
    const t = setTimeout(() => amountRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [quickAddOpen, editingTx, accounts]);

  const hid = user?.data?.household_id || user?.household_id;

  const applyBalance = async (acc, delta) => {
    if (!acc) return;
    await db.entities.Account.update(acc.id, {
      balance: Number((Number(acc.balance || 0) + delta).toFixed(2)),
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    if (!accountId) {
      toast({ title: "Sélectionnez un compte", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const acc = accounts.find((a) => a.id === accountId);
      const signed = type === "expense" ? -Math.abs(value) : Math.abs(value);
      // Création à la volée d'une catégorie saisie par l'utilisateur
      let catId = categoryId || null;
      if (newCat && newCatName.trim()) {
        const created = await db.entities.Category.create({
          household_id: hid,
          name: newCatName.trim(),
          type,
          color: "#6D7175",
          icon: "Tag",
        });
        catId = created.id;
      }
      if (editingTx) {
        const oldAcc = accounts.find((a) => a.id === editingTx.account_id);
        const oldSigned =
          editingTx.type === "expense"
            ? -Math.abs(editingTx.amount)
            : Math.abs(editingTx.amount);
        await db.entities.Transaction.update(editingTx.id, {
          account_id: accountId,
          category_id: catId,
          amount: Math.abs(value),
          type,
          date,
          notes,
          profile_id: user.id,
        });
        if (oldAcc) await applyBalance(oldAcc, -oldSigned);
        if (acc) await applyBalance(acc, signed);
      } else {
        await db.entities.Transaction.create({
          household_id: hid,
          account_id: accountId,
          category_id: catId,
          profile_id: user.id,
          amount: Math.abs(value),
          type,
          date,
          notes,
        });
        if (acc) await applyBalance(acc, signed);
      }
      invalidate();
      logHouseholdAction(
        user,
        editingTx ? "transaction_updated" : "transaction_created",
        `${type === "expense" ? "Dépense" : "Revenu"} de ${Math.abs(value)}`,
        `Date : ${date}${acc ? ` · Compte : ${acc.name}` : ""}${notes ? ` · ${notes}` : ""}`
      );
      toast({
        title: editingTx ? "Transaction modifiée" : "Transaction ajoutée",
      });
      closeQuickAdd();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
      <div className="grid grid-cols-2 gap-2">
        {TYPE_TABS.map((t) => {
          const active = type === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setType(t.key);
                setCategoryId("");
              }}
              className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? t.key === "expense"
                    ? "border-expense bg-expense-soft text-expense"
                    : "border-income bg-income-soft text-income"
                  : "border-border bg-surface text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qa-amount" className="text-xs uppercase tracking-wide text-muted-foreground">
          Montant
        </Label>
        <Input
          id="qa-amount"
          ref={amountRef}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          placeholder="0,00"
          className="font-mono-nums text-2xl h-14 border-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Compte</Label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-10 rounded-full border border-input bg-surface px-3 text-sm"
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Catégorie</Label>
          {newCat ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                placeholder="Nom de la nouvelle catégorie"
                className="h-10"
              />
              <button
                type="button"
                onClick={() => { setNewCat(false); setNewCatName(""); }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                aria-label="Annuler la nouvelle catégorie"
              >
                ×
              </button>
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setCategoryId("");
                  setNewCat(true);
                } else {
                  setCategoryId(e.target.value);
                }
              }}
              className="h-10 rounded-full border border-input bg-surface px-3 text-sm"
            >
              <option value="">—</option>
              {visibleCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">＋ Nouvelle catégorie…</option>
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Détail optionnel"
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={saving} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editingTx ? "Enregistrer" : "Ajouter"}
      </Button>
    </form>
  );

  const title = editingTx ? "Modifier la transaction" : "Nouvelle transaction";

  if (isMobile) {
    return (
      <Drawer open={quickAddOpen} onOpenChange={(o) => !o && closeQuickAdd()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">{formBody}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={quickAddOpen} onOpenChange={(o) => !o && closeQuickAdd()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">{formBody}</div>
      </SheetContent>
    </Sheet>
  );
}