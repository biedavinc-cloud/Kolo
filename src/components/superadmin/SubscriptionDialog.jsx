import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLANS = ["starter", "pro", "premium", "family"];
const STATUSES = ["trial", "active", "expired"];

// Ajustement manuel d'un abonnement : plan, statut, prolongation ou offre
export default function SubscriptionDialog({ tenant, onClose, onSave, busy }) {
  const [plan, setPlan] = useState(tenant?.plan || "starter");
  const [status, setStatus] = useState(tenant?.status || "active");
  const [periodEnd, setPeriodEnd] = useState(tenant?.period_end || "");
  const [trialEnd, setTrialEnd] = useState(tenant?.trial_end || "");

  const submit = () => {
    onSave({
      household_id: tenant.id,
      plan,
      status,
      period_end: periodEnd || null,
      trial_end: trialEnd || null,
    });
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abonnement — {tenant?.name}</DialogTitle>
          <DialogDescription>
            Ajustez manuellement le plan, le statut ou la durée d'accès de ce foyer (prolonger,
            réduire ou offrir).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-plan">Plan</Label>
              <select
                id="sub-plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-status">Statut</Label>
              <select
                id="sub-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-period">Fin de période</Label>
              <Input id="sub-period" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-trial">Fin d'essai</Label>
              <Input id="sub-trial" type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}