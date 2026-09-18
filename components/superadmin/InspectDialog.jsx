const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";

// Inspection en lecture seule d'un foyer ("vue du foyer" pour le dépannage)
export default function InspectDialog({ tenant, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    setData(null);
    db.functions
      .invoke("superAdminAction", { action: "inspect_household", household_id: tenant.id })
      .then((res) => setData(res.data))
      .catch((e) => setData({ error: e.response?.data?.error || e.message }))
      .finally(() => setLoading(false));
  }, [tenant]);

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> {tenant?.name}
          </DialogTitle>
          <DialogDescription>
            Vue en lecture seule pour le dépannage — aucune donnée n'est modifiée.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {data?.error && <p className="text-sm text-expense">{data.error}</p>}

        {data && !data.error && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Devise</div>
                <div className="font-medium">{data.household.currency || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Créé le</div>
                <div className="font-medium">
                  {new Date(data.household.created_date).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Statut</div>
                <div className="font-medium">{data.household.suspended ? "Suspendu" : "Actif"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Abonnement</div>
                <div className="font-medium capitalize">
                  {data.subscription ? `${data.subscription.plan} (${data.subscription.status})` : "Aucun"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comptes ({data.accounts.length})
              </h4>
              <div className="space-y-1.5">
                {data.accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span>{a.name}</span>
                    <span className="font-mono-nums text-muted-foreground">
                      {a.balance ?? 0} {a.currency}
                    </span>
                  </div>
                ))}
                {data.accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun compte.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dernières transactions
              </h4>
              <div className="space-y-1.5">
                {data.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate">{t.notes || "Transaction"}</div>
                      <div className="text-[11px] text-muted-foreground">{t.date}</div>
                    </div>
                    <span
                      className={`font-mono-nums font-medium ${
                        t.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {t.amount}
                    </span>
                  </div>
                ))}
                {data.transactions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucune transaction.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Budgets ({data.budgets.length})
              </h4>
              <div className="space-y-1.5">
                {data.budgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span>{b.month_year}</span>
                    <span className="font-mono-nums text-muted-foreground">{b.amount_limit}</span>
                  </div>
                ))}
                {data.budgets.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun budget.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}