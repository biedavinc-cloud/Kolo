const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDebts, useAccounts, useInvalidateAll } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { getHouseholdId } from "@/lib/useHousehold";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, todayISO } from "@/lib/format";
import { Landmark, Plus, Pencil, Trash2, Loader2, CheckCircle2 } from "lucide-react";

export default function Dettes() {
  const { user } = useAuth();
  const householdId = getHouseholdId(user);
  const { currency } = useAppShell();
  const { data: debts = [] } = useDebts(user);
  const { data: accounts = [] } = useAccounts(user);
  const invalidate = useInvalidateAll(user);
  const { toast } = useToast();

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [creditor, setCreditor] = useState("");
  const [initial, setInitial] = useState("");
  const [remaining, setRemaining] = useState("");
  const [monthly, setMonthly] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [repayValue, setRepayValue] = useState("");

  const accName = (id) => accounts.find((a) => a.id === id)?.name || "";

  const startCreate = () => {
    setEditing({});
    setName("");
    setCreditor("");
    setInitial("");
    setRemaining("");
    setMonthly("");
    setAccountId("");
  };

  const startEdit = (d) => {
    setEditing(d);
    setName(d.name);
    setCreditor(d.creditor || "");
    setInitial(String(d.initial_amount || ""));
    setRemaining(String(d.remaining_amount || ""));
    setMonthly(String(d.monthly_payment || ""));
    setAccountId(d.account_id || "");
  };

  const save = async (e) => {
    e.preventDefault();
    const init = Number(initial);
    const rem = remaining === "" ? init : Number(remaining);
    if (!name.trim() || !init || rem == null) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        creditor: creditor.trim() || null,
        initial_amount: init,
        remaining_amount: rem,
        monthly_payment: Number(monthly) || 0,
        account_id: accountId || null,
      };
      if (editing.id) {
        await db.entities.Debt.update(editing.id, payload);
        toast({ title: "Dette mise à jour" });
      } else {
        await db.entities.Debt.create({ ...payload, household_id: householdId });
        toast({ title: "Dette ajoutée" });
      }
      invalidate();
      setEditing(null);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const repay = async (d) => {
    const v = Number(repayValue);
    if (!v || v <= 0) return;
    try {
      const newRemaining = Math.max(0, Number(d.remaining_amount || 0) - v);
      await db.entities.Debt.update(d.id, { remaining_amount: newRemaining });
      // Transaction de dépense liée au compte de remboursement
      if (d.account_id) {
        const acc = accounts.find((a) => a.id === d.account_id);
        await db.entities.Transaction.create({
          household_id: householdId,
          account_id: d.account_id,
          amount: v,
          type: "expense",
          date: todayISO(),
          notes: `Remboursement — ${d.name}`,
        });
        if (acc) {
          await db.entities.Account.update(acc.id, {
            balance: Number(acc.balance || 0) - v,
          });
        }
      }
      toast({
        title: "Remboursement enregistré",
        description: newRemaining === 0 ? "Dette entièrement remboursée !" : undefined,
      });
      setRepayValue("");
      invalidate();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (d) => {
    await db.entities.Debt.delete(d.id);
    invalidate();
    toast({ title: "Dette supprimée" });
  };

  const endEstimate = (d) => {
    const rem = Number(d.remaining_amount || 0);
    const monthly = Number(d.monthly_payment || 0);
    if (rem <= 0) return "Remboursée";
    if (!monthly) return "Mensualité non définie";
    const months = Math.ceil(rem / monthly);
    const dEnd = new Date();
    dEnd.setMonth(dEnd.getMonth() + months);
    return dEnd.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const totalRemaining = debts.reduce((s, d) => s + Number(d.remaining_amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5" /> Aperçu de la dette
          </h1>
          <p className="text-sm text-muted-foreground">
            Dettes en cours, remboursements effectués et estimation de libération totale.
          </p>
        </div>
        <Button onClick={startCreate} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle dette
        </Button>
      </div>

      {debts.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total restant à rembourser</div>
          <div className="mt-1 font-mono-nums text-2xl font-semibold">{formatCurrency(totalRemaining, currency)}</div>
        </div>
      )}

      {editing !== null && (
        <form onSubmit={save} className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crédit auto, prêt étudiant…" autoFocus required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Créancier</Label>
              <Input value={creditor} onChange={(e) => setCreditor(e.target.value)} placeholder="Banque, organisme…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Montant initial</Label>
              <Input type="number" min="0" step="0.01" value={initial} onChange={(e) => setInitial(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Montant restant</Label>
              <Input type="number" min="0" step="0.01" value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="= montant initial" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Mensualité</Label>
              <Input type="number" min="0" step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Compte de remboursement</Label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
              >
                <option value="">Aucun (ne pas créer de transaction)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing.id ? "Enregistrer" : "Ajouter"}
            </Button>
            <Button type="button" variant="outline" className="h-9" onClick={() => setEditing(null)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {debts.length === 0 && editing === null ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto text-income mb-2" />
          <p className="text-sm text-muted-foreground">Aucune dette suivie. Tout est en ordre !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => {
            const init = Number(d.initial_amount || 1);
            const rem = Number(d.remaining_amount || 0);
            const repaid = init - rem;
            const pct = Math.min(100, Math.max(0, Math.round((repaid / init) * 100)));
            const paid = rem <= 0;
            return (
              <div key={d.id} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {d.name}
                      {paid && <CheckCircle2 className="inline h-4 w-4 text-income ml-1.5" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.creditor ? `${d.creditor} · ` : ""}
                      {accName(d.account_id) ? `Remboursement via ${accName(d.account_id)} · ` : ""}
                      Libération estimée : {endEstimate(d)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(d)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(d)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Progress value={pct} className={paid ? "bg-income-soft" : undefined} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-mono-nums text-muted-foreground">
                    Remboursé {formatCurrency(Math.max(0, repaid), currency)} sur {formatCurrency(init, currency)}
                  </span>
                  <span className={`font-mono-nums font-semibold ${paid ? "text-income" : ""}`}>
                    {paid ? "Soldé" : `${formatCurrency(rem, currency)} restants · ${pct} %`}
                  </span>
                </div>

                {!paid && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Montant remboursé ce mois…"
                      value={repayValue}
                      onChange={(e) => setRepayValue(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={() => repay(d)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Enregistrer le remboursement
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}