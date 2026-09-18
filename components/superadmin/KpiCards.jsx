import React from "react";
import { Users, DollarSign, CreditCard, Ban, ShieldCheck } from "lucide-react";

function KpiCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-mono-nums text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// KPIs globaux de la plateforme : foyers, MRR, abonnements
export default function KpiCards({ kpis }) {
  if (!kpis) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Foyers actifs"
        value={kpis.households_active}
        sub={`${kpis.households_total} au total`}
        icon={Users}
      />
      <KpiCard label="MRR" value={`$${kpis.mrr}`} sub="revenu mensuel récurrent" icon={DollarSign} />
      <KpiCard
        label="Abonnements actifs"
        value={kpis.subscriptions_active}
        sub={`${kpis.subscriptions_trial} essais en cours`}
        icon={CreditCard}
      />
      <KpiCard
        label="Suspendus / expirés"
        value={kpis.households_suspended + kpis.subscriptions_expired}
        sub={`${kpis.households_suspended} foyers · ${kpis.subscriptions_expired} abos`}
        icon={Ban}
      />
      <KpiCard label="Super admins" value={kpis.super_admins} sub="accès global" icon={ShieldCheck} />
    </div>
  );
}