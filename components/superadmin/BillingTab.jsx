import React from "react";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

const PLAN_LABELS = { starter: "Starter", pro: "Pro", premium: "Premium", family: "Family" };
const BAR_COLORS = { starter: "#94a3b8", pro: "#0ea5a4", premium: "#00875a", family: "#005f43" };

// Revenus & facturation : MRR, ARR, répartition par plan et paiements Stripe réels
export default function BillingTab({ data }) {
  const mrr = data?.kpis?.mrr || 0;
  const plans = data?.mrr_by_plan || {};
  const payments = data?.payments || [];
  const totalPlanMrr = Object.values(plans).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MRR</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-mono-nums text-2xl font-semibold">${mrr}</div>
          <div className="text-xs text-muted-foreground">revenu mensuel récurrent</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ARR projeté</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-mono-nums text-2xl font-semibold">${mrr * 12}</div>
          <div className="text-xs text-muted-foreground">sur 12 mois</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Abonnements actifs</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-mono-nums text-2xl font-semibold">
            {data?.kpis?.subscriptions_active || 0}
          </div>
          <div className="text-xs text-muted-foreground">
            {data?.kpis?.subscriptions_trial || 0} essais en cours
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Répartition du revenu par plan</h3>
        {Object.keys(plans).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun abonnement actif pour le moment — les essais gratuits ne génèrent pas de revenu.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(plans).map(([plan, value]) => (
              <div key={plan}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{PLAN_LABELS[plan] || plan}</span>
                  <span className="font-mono-nums text-muted-foreground">${value}/mois</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((value / (totalPlanMrr || 1)) * 100)}%`,
                      background: BAR_COLORS[plan] || "#94a3b8",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Pour ajuster un plan, prolonger ou offrir un accès, utilisez l'onglet « Foyers » → icône
          carte bancaire.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Paiements récents (Stripe)</h3>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">{p.customer_email || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono-nums font-medium">
                    {p.amount.toFixed(2)} {p.currency}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun paiement enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}