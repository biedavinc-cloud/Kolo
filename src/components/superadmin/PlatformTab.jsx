import React from "react";
import { Switch } from "@/components/ui/switch";
import { Wrench, Bot, BarChart3, ShieldAlert } from "lucide-react";

function ToggleRow({ icon: Icon, title, description, checked, onCheckedChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="flex h-9 items-center bg-white px-1 rounded-md">
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
    </div>
  );
}

// Plateforme : mode maintenance global + feature flags distants
export default function PlatformTab({ settings, onSetMaintenance, onSetFlag, busy }) {
  return (
    <div className="space-y-4">
      <ToggleRow
        icon={Wrench}
        title="Mode maintenance"
        description="Affiche une page de maintenance à tous les utilisateurs (hors super admins)."
        checked={!!settings?.maintenance_mode}
        onCheckedChange={(v) => onSetMaintenance(v)}
        disabled={busy}
      />
      <ToggleRow
        icon={Bot}
        title="Assistant IA"
        description="Active ou désactive l'assistant intelligent sur toute la plateforme."
        checked={settings ? settings.flag_ai_assistant !== false : true}
        onCheckedChange={(v) => onSetFlag("flag_ai_assistant", v)}
        disabled={busy}
      />
      <ToggleRow
        icon={BarChart3}
        title="Rapports avancés"
        description="Active ou désactive les modules d'analyse (rapports, répartition, flux)."
        checked={settings ? settings.flag_rapports_avances !== false : true}
        onCheckedChange={(v) => onSetFlag("flag_rapports_avances", v)}
        disabled={busy}
      />
      {settings?.updated_by && (
        <p className="text-xs text-muted-foreground">
          Dernière modification par {settings.updated_by}
        </p>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-warning" />
        <div className="text-xs text-muted-foreground">
          Surveillance des erreurs : les logs d'exécution (erreurs système et alertes) sont
          consultables en temps réel dans le tableau de bord Base44 → Logs. Chaque action menée ici
          est tracée dans l'audit.
        </div>
      </div>
    </div>
  );
}