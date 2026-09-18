import { db } from "@/api/client";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useIsSuperAdmin } from "@/lib/superAdmins";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
import KpiCards from "@/components/superadmin/KpiCards";
import TenantsTable from "@/components/superadmin/TenantsTable";
import InspectDialog from "@/components/superadmin/InspectDialog";
import SubscriptionDialog from "@/components/superadmin/SubscriptionDialog";
import PlatformTab from "@/components/superadmin/PlatformTab";
import StaffTab from "@/components/superadmin/StaffTab";
import AuditTab from "@/components/superadmin/AuditTab";
import BillingTab from "@/components/superadmin/BillingTab";
import UsersTab from "@/components/superadmin/UsersTab";
import BroadcastSection from "@/components/superadmin/BroadcastSection";

const TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "tenants", label: "Foyers" },
  { id: "billing", label: "Revenus" },
  { id: "users", label: "Utilisateurs" },
  { id: "platform", label: "Plateforme" },
  { id: "broadcast", label: "Diffusions" },
  { id: "staff", label: "Équipe" },
  { id: "audit", label: "Audit" },
];

// Module Super Admin — contrôle global de la plateforme, strictement réservé
// aux super administrateurs. Interface fintech minimaliste, 100% responsive.
export default function SuperAdmin() {
  const { user } = useAuth();
  const isSuper = useIsSuperAdmin(user);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [inspectTenant, setInspectTenant] = useState(null);
  const [subTenant, setSubTenant] = useState(null);
  const [deleteTenant, setDeleteTenant] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["superAdminDashboard"],
    queryFn: async () => (await db.functions.invoke("superAdminDashboard", {})).data,
    enabled: isSuper,
    refetchInterval: 60000,
  });

  if (!isSuper) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-expense" />
        <h1 className="text-lg font-semibold">Accès refusé</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette section est strictement réservée aux super administrateurs de Kolo.
        </p>
      </div>
    );
  }

  const act = async (payload, okMsg) => {
    setBusy(true);
    try {
      await db.functions.invoke("superAdminAction", payload);
      await refetch();
      qc.invalidateQueries({ queryKey: ["platformSettings"] });
      if (okMsg) toast({ title: okMsg });
      return true;
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubscriptionSave = async (values) => {
    const ok = await act({ action: "adjust_subscription", ...values }, "Abonnement mis à jour");
    if (ok) setSubTenant(null);
  };

  const handleDelete = async () => {
    const ok = await act(
      { action: "delete_household", household_id: deleteTenant.id },
      "Foyer supprimé définitivement"
    );
    setDeleteTenant(null);
    if (!ok) return;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" /> Super Administration
          </h1>
          <p className="text-sm text-muted-foreground">
            Contrôle global de la plateforme Kolo — {user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Onglets — défilement fluide sur mobile */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex min-w-max gap-1 rounded-xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <div className="space-y-5">
              <KpiCards kpis={data?.kpis} />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Dernières actions sensibles</h3>
                <AuditTab audit={(data?.audit || []).slice(0, 6)} />
              </div>
            </div>
          )}

          {tab === "tenants" && (
            <TenantsTable
              tenants={data?.tenants || []}
              busy={busy}
              onInspect={setInspectTenant}
              onSubscription={setSubTenant}
              onToggleSuspend={(t) =>
                act(
                  {
                    action: t.suspended ? "unsuspend_household" : "suspend_household",
                    household_id: t.id,
                  },
                  t.suspended ? "Foyer réactivé" : "Foyer suspendu"
                )
              }
              onDelete={setDeleteTenant}
            />
          )}

          {tab === "billing" && <BillingTab data={data} />}

          {tab === "users" && <UsersTab users={data?.users || []} tenants={data?.tenants || []} />}

          {tab === "broadcast" && (
            <BroadcastSection
              announcements={data?.announcements || []}
              busy={busy}
              onBroadcast={(payload) =>
                act({ action: "broadcast", ...payload }, "Diffusion envoyée à tous les utilisateurs")
              }
            />
          )}

          {tab === "platform" && (
            <PlatformTab
              settings={data?.settings}
              busy={busy}
              onSetMaintenance={(v) =>
                act({ action: "set_maintenance", value: v }, v ? "Maintenance activée" : "Maintenance désactivée")
              }
              onSetFlag={(flag, v) => act({ action: "set_flag", flag, value: v }, "Feature flag mis à jour")}
            />
          )}

          {tab === "staff" && <StaffTab />}

          {tab === "audit" && <AuditTab audit={data?.audit} />}
        </>
      )}

      {/* Dialogues d'action */}
      <InspectDialog tenant={inspectTenant} onClose={() => setInspectTenant(null)} />
      <SubscriptionDialog
        key={subTenant?.id || "none"}
        tenant={subTenant}
        onClose={() => setSubTenant(null)}
        onSave={handleSubscriptionSave}
        busy={busy}
      />
      <Dialog open={!!deleteTenant} onOpenChange={(o) => !o && setDeleteTenant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-expense">Supprimer « {deleteTenant?.name} » ?</DialogTitle>
            <DialogDescription>
              Suppression définitive du foyer et de toutes ses données : comptes, transactions,
              budgets, catégories, récurrences, objectifs, dettes et abonnement. Action irréversible,
              tracée dans l'audit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTenant(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}