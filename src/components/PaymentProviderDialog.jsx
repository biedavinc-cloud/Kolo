import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CreditCard } from "lucide-react";

// Choix du moyen de paiement, affiché uniquement quand plusieurs PSP sont
// configurés côté serveur (voir useCheckoutPlan).
export default function PaymentProviderDialog({ plan, providers, selecting, onChoose, onClose }) {
  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Choisissez votre moyen de paiement
          </DialogTitle>
          <DialogDescription>Plan {plan?.name} — ${plan?.price}/mois</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onChoose(p.id)}
              disabled={!!selecting}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3.5 text-left text-sm font-medium transition-colors hover:border-primary/50 disabled:opacity-50"
            >
              {p.label}
              {selecting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
