import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAccounts, useInvalidateAll } from "@/lib/useFinanceData";
import { getHouseholdId } from "@/lib/useHousehold";

import { formatCurrency } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, CreditCard, Banknote, PiggyBank, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import CurrencySelect from "@/components/CurrencySelect";
import { useSubscription } from "@/lib/useSubscription";
import { getPlanLimits } from "@/lib/plans";

const TYPE_META = {
  checking: { label: "Courant", icon: Wallet },
  savings: { label: "Épargne", icon: PiggyBank },
  cash: { label: "Espèces", icon: Banknote },
  credit: { label: "Carte de crédit", icon: CreditCard },
};

function AccountForm({ initial, onSubmit, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "checking");
  const [balance, setBalance] = useState(initial ? String(initial.balance ?? 0) : "0");
  const [currency, setCurrency] = useState(initial?.currency || "EUR");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name.trim(),
          type,
          balance: parseFloat(balance.replace(",", ".")) || 0,
          currency,
        });
      }}
      className="flex flex-col gap-4 px-4 pb-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label>Nom du compte</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Compte courant" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Devise</Label>
          <CurrencySelect value={currency} onChange={setCurrency} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Solde initial</Label>
        <Input type="text" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9.,-]/g, ""))} className="font-mono-nums" />
      </div>
      <Button type="submit" disabled={saving} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Enregistrer" : "Créer le compte"}
      </Button>
    </form>
  );
}

export default function Accounts() {
  const { user } = useAuth();
  const { data: accounts = [] } = useAccounts(user);
  const householdId = getHouseholdId(user);
  const invalidate = useInvalidateAll(user);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { plan } = useSubscription(user);
  const limits = getPlanLimits(plan);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setOpen(true); };

  const handleSubmit = async (vals) => {
    setSaving(true);
    try {
      if (editing) {
        await db.entities.Account.update(editing.id, vals);
        toast({ title: "Compte mis à jour" });
      } else {
        if (limits.accounts !== null && accounts.length >= limits.accounts) {
          toast({
            title: "Limite de comptes atteinte",
            description: `Votre plan autorise ${limits.accounts} compte(s). Passez à un plan supérieur depuis l'onglet Abonnement.`,
            variant: "destructive",
          });
          return;
        }
        await db.entities.Account.create({ household_id: householdId, ...vals });
        toast({ title: "Compte créé" });
      }
      invalidate();
      setOpen(false);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a) => {
    try {
      await db.entities.Account.delete(a.id);
      invalidate();
      toast({ title: "Compte supprimé" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const total = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const trigger = (
    <Button onClick={openCreate} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4 mr-1.5" /> Nouveau compte
    </Button>
  );

  const formContent = (
    <AccountForm initial={editing} onSubmit={handleSubmit} saving={saving} />
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Comptes</h1>
          <p className="text-sm text-muted-foreground">
            {new Set(accounts.map((a) => a.currency)).size > 1
              ? "Multi-devises : chaque compte est suivi dans sa propre devise"
              : `Total : ${formatCurrency(total, accounts[0]?.currency || "EUR")}`}
          </p>
        </div>
        {!isMobile && trigger}
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">Aucun compte pour le moment.</p>
          {isMobile && trigger}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((a) => {
            const meta = TYPE_META[a.type] || TYPE_META.checking;
            const neg = Number(a.balance || 0) < 0;
            return (
              <div key={a.id} className="group rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{meta.label} · {a.currency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(a)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className={`mt-4 font-mono-nums text-2xl font-semibold ${neg ? "text-expense" : "text-foreground"}`}>
                  {formatCurrency(a.balance, a.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>{editing ? "Modifier le compte" : "Nouveau compte"}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto">{formContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 max-w-md">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle>{editing ? "Modifier le compte" : "Nouveau compte"}</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}