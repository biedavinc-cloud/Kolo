import React from "react";

// Journal d'audit : trace de toutes les actions sensibles des administrateurs
export default function AuditTab({ audit }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Administrateur</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Cible</th>
            <th className="px-4 py-3 font-medium">Détails</th>
          </tr>
        </thead>
        <tbody>
          {(audit || []).map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {new Date(a.created_date).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-3">{a.actor_email}</td>
              <td className="px-4 py-3 font-medium">{a.action}</td>
              <td className="px-4 py-3">{a.target}</td>
              <td className="max-w-[280px] truncate px-4 py-3 text-muted-foreground">{a.details}</td>
            </tr>
          ))}
          {(!audit || audit.length === 0) && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune action enregistrée pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}