import React from "react";
import { ShieldCheck } from "lucide-react";

// Gestion globale des utilisateurs de la plateforme (lecture + rôle)
export default function UsersTab({ users, tenants }) {
  const householdName = (hid) => tenants.find((t) => t.id === hid)?.name || "—";

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Utilisateur</th>
            <th className="px-4 py-3 font-medium">Rôle</th>
            <th className="px-4 py-3 font-medium">Foyer</th>
            <th className="px-4 py-3 font-medium">Inscription</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
              <td className="px-4 py-3">
                <div className="font-medium">{u.full_name || u.email}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </td>
              <td className="px-4 py-3">
                {u.role === "admin" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Utilisateur</span>
                )}
              </td>
              <td className="px-4 py-3">{householdName(u.household_id)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(u.created_date).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun utilisateur inscrit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}