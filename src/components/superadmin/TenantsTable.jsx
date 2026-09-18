import React, { useState } from "react";
import { Eye, CreditCard, PauseCircle, PlayCircle, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function StatusBadge({ tenant }) {
  if (tenant.suspended)
    return (
      <span className="rounded-full bg-expense-soft px-2 py-0.5 text-[11px] font-medium text-expense">
        Suspendu
      </span>
    );
  if (tenant.status === "active")
    return (
      <span className="rounded-full bg-income-soft px-2 py-0.5 text-[11px] font-medium text-income">
        Actif
      </span>
    );
  if (tenant.status === "trial")
    return (
      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
        Essai
      </span>
    );
  if (tenant.status === "expired")
    return (
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Expiré
      </span>
    );
  return <span className="text-[11px] text-muted-foreground">—</span>;
}

// Table des foyers (tenants) : recherche, métriques et actions d'administration
export default function TenantsTable({ tenants, onInspect, onSubscription, onToggleSuspend, onDelete, busy }) {
  const [q, setQ] = useState("");
  const filtered = tenants.filter(
    (t) =>
      (t.name || "").toLowerCase().includes(q.toLowerCase()) ||
      (t.owner_email || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un foyer ou un propriétaire…"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Foyer</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Comptes</th>
              <th className="px-4 py-3 font-medium">Transactions</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.owner_email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t.created_date ? new Date(t.created_date).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3 capitalize">{t.plan || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge tenant={t} />
                </td>
                <td className="px-4 py-3 font-mono-nums">{t.accounts}</td>
                <td className="px-4 py-3 font-mono-nums">{t.transactions}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => onInspect(t)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      title="Inspecter le foyer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onSubscription(t)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      title="Ajuster l'abonnement"
                    >
                      <CreditCard className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleSuspend(t)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-warning-soft hover:text-warning disabled:opacity-50"
                      title={t.suspended ? "Réactiver le foyer" : "Suspendre le foyer"}
                    >
                      {t.suspended ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-expense-soft hover:text-expense disabled:opacity-50"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucun foyer trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}