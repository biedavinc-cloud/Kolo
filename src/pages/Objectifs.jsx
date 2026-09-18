import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useGoals, useInvalidateAll } from "@/lib/useFinanceData";
import { useAppShell } from "@/components/Layout";
import { getHouseholdId } from "@/lib/useHousehold";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, shortDate, todayISO } from "@/lib/format";
import { Target, Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";

export default function Objectifs() {
  const { user } = useAuth();
  const householdId = getHouseholdId(user);
  const { currency } = useAppShell();
  const { data: goals = [] } = useGoals(user);
  const invalidate = useInvalidateAll(user);
  const { toast } = useToast();

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [fundValue, setFundValue] = useState("");

  const startCreate = () => {
    setEditing({});
    setName("");
    setTarget("");
    setCurrent("");
    setDeadline("");
  };

  const startEdit = (g) => {
    setEditing(g);
    setName(g.name);
    setTarget(String(g.target_amount || ""));
    setCurrent(String(g.current_amount || 0));
    setDeadline(g.deadline ? g.deadline.slice(0, 10) : "");
  };

  const save = async (e) => {
    e.preventDefault();
    const t = Number(target);
    if (!name.trim() || !t || t <= 0) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: t,
        current_amount: Number(current) || 0,
        deadline: deadline || null,
      };
      if (editing.id) {
        await db.entities.SavingsGoal.update(editing.id, payload);
        toast({ title: "Objectif mis à jour" });
      } else {
        await db.entities.SavingsGoal.create({ ...payload, household_id: householdId });
        toast({ title: "Objectif créé" });
      }
      invalidate();
      setEditing(null);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addFunds = async (g) => {
    const v = Number(fundValue);
    if (!v || v <= 0) return;
    try {
      await db.entities.SavingsGoal.update(g.id, {
        current_amount: Number(g.current_amount || 0) + v,
      });
      toast({ title: "Épargne ajoutée", description: formatCurrency(v, currency) });
      setFundValue("");
      invalidate();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (g) => {
    await db.entities.SavingsGoal.delete(g.id);
    invalidate();
    toast({ title: "Objectif supprimé" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5" /> Objectifs épargne
          </h1>
          <p className="text-sm text-muted-foreground">
            Définissez des objectifs et suivez leur progression.
          </p>
        </div>
        <Button onClick={startCreate} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> Nouvel objectif
        </Button>
      </div>

      {editing !== null && (
        <form onSubmit={save} className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Nom de l'objectif</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacances, fonds d'urgence…" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Échéance (optionnel)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Montant cible</Label>
              <Input type="number" min="0" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Montant déjà épargné</Label>
              <Input type="number" min="0" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing.id ? "Enregistrer" : "Créer"}
            </Button>
            <Button type="button" variant="outline" className="h-9" onClick={() => setEditing(null)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {goals.length === 0 && editing === null ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun objectif pour l'instant. Créez-en un pour suivre votre épargne.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {goals.map((g) => {
            const cur = Number(g.current_amount || 0);
            const tgt = Number(g.target_amount || 1);
            const pct = Math.min(100, Math.round((cur / tgt) * 100));
            const done = cur >= tgt;
            const daysLeft = g.deadline
              ? Math.ceil((new Date(g.deadline) - new Date(todayISO())) / 86400000)
              : null;
            return (
              <div key={g.id} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {g.name}
                      {done && <Check className="h-4 w-4 text-income" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {g.deadline ? (
                        <>
                          Échéance : {shortDate(g.deadline)}
                          {daysLeft !== null && !done && (
                            <> · {daysLeft >= 0 ? `${daysLeft} jours restants` : "échéance dépassée"}</>
                          )}
                        </>
                      ) : (
                        "Sans échéance"
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(g)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(g)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Progress value={pct} className={done ? "bg-income-soft" : undefined} />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono-nums">
                    {formatCurrency(cur, currency)} / {formatCurrency(tgt, currency)}
                  </span>
                  <span className={`font-mono-nums font-semibold ${done ? "text-income" : "text-muted-foreground"}`}>
                    {pct} %
                  </span>
                </div>

                {!done && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ajouter de l'épargne…"
                      value={fundValue}
                      onChange={(e) => setFundValue(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={() => addFunds(g)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Alimenter
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