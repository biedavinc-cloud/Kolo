import { db } from "@/api/client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getHouseholdId } from "@/lib/useHousehold";

import { ScrollText, ArrowLeftRight, Loader2 } from "lucide-react";

const ACTION_META = {
  transaction_created: { label: "Transaction créée", icon: ArrowLeftRight, tone: "text-income" },
  transaction_updated: { label: "Transaction modifiée", icon: ArrowLeftRight, tone: "text-primary" },
};

const DEFAULT_META = { label: "Action", icon: ScrollText, tone: "text-muted-foreground" };

function formatDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || "";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function JournalActivite() {
  const { user } = useAuth();
  const hid = getHouseholdId(user);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["householdAuditLogs", hid],
    queryFn: () => db.entities.HouseholdAuditLog.list("-created_date", 200),
    enabled: !!hid,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <ScrollText className="h-5 w-5" /> Journal d'activité
        </h1>
        <p className="text-sm text-muted-foreground">
          Historique des actions effectuées sur le compte du foyer — qui a fait quoi et quand.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune action enregistrée pour l'instant. Créez ou modifiez une transaction : elle
            apparaîtra ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface divide-y divide-border">
          {logs.map((log) => {
            const meta = ACTION_META[log.action] || { ...DEFAULT_META, label: log.action };
            return (
              <div key={log.id} className="flex items-start gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary ${meta.tone}`}>
                  <meta.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{log.target || "—"}</div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>Par {log.actor || "Membre"}</span>
                    {log.details && <span className="truncate">{log.details}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}