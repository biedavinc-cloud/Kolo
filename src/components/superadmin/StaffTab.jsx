import { superAdminApi } from "@/api/client";
import { db } from "@/api/client";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Lock, UserPlus, Trash2, Loader2, ShieldCheck, Eye, Info } from "lucide-react";
import { SUPER_ADMIN_EMAILS } from "@/lib/superAdmins";

// Rôles délégués et leurs accès personnalisés
const DELEGATED_ROLES = {
  admin: {
    label: "Administrateur délégué",
    desc: "Contrôle total : foyers, abonnements, maintenance, diffusions, utilisateurs. Ne gère pas l'équipe (réservé aux fondateurs).",
  },
  analyste: {
    label: "Analyste (lecture seule)",
    desc: "Consulte le tableau de bord, les foyers, la facturation et les utilisateurs. Aucune action sensible possible.",
  },
};

// Équipe : fondateurs protégés + collaborateurs délégués avec rôles personnalisés
export default function StaffTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isFounder = SUPER_ADMIN_EMAILS.includes((user?.email || "").toLowerCase());

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [busy, setBusy] = useState(false);

  const { data: supers = [], isLoading } = useQuery({
    queryKey: ["superAdmins"],
    queryFn: () => db.entities.SuperAdmin.list(),
  });

  const add = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await superAdminApi.addTeamMember(email.trim(), role);
      await qc.invalidateQueries({ queryKey: ["superAdmins"] });
      toast({ title: "Collaborateur ajouté", description: `${email.trim()} — ${DELEGATED_ROLES[role].label}` });
      setEmail("");
    } catch (err) {
      toast({
        title: "Ajout impossible",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (rec, newRole) => {
    if (newRole === (rec.role || "admin")) return;
    setBusy(true);
    try {
      // Le serveur fait un upsert sur l'email : ajouter à nouveau avec le
      // nouveau rôle a le même effet qu'un changement de rôle dédié.
      await superAdminApi.addTeamMember(rec.email, newRole);
      await qc.invalidateQueries({ queryKey: ["superAdmins"] });
      toast({ title: "Rôle mis à jour", description: `${rec.email} → ${DELEGATED_ROLES[newRole].label}` });
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (rec) => {
    setBusy(true);
    try {
      await superAdminApi.removeTeamMember(rec.email);
      await qc.invalidateQueries({ queryKey: ["superAdmins"] });
      toast({ title: "Accès révoqué", description: rec.email });
    } catch (err) {
      toast({
        title: "Révocation impossible",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4" /> Fondateurs (protégés)
        </h3>
        <div className="space-y-2">
          {SUPER_ADMIN_EMAILS.map((e) => (
            <div key={e} className="flex items-center justify-between rounded-full bg-secondary/60 px-3 py-2.5">
              <span className="text-sm font-medium">{e}</span>
              <span className="rounded-full border border-primary/30 bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                Accès total
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> Matrice des rôles
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(DELEGATED_ROLES).map(([key, r]) => (
            <div key={key} className="rounded-xl border border-border p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                {key === "analyste" ? <Eye className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {r.label}
              </div>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Seuls les fondateurs peuvent inviter, changer les rôles ou révoquer un accès. Chaque
          opération est tracée dans l'audit.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Collaborateurs délégués ({supers.length})
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : supers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun collaborateur délégué pour le moment.</p>
        ) : (
          <div className="divide-y divide-border">
            {supers.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.email}</div>
                  <div className="text-xs text-muted-foreground">Ajouté par {s.added_by || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      (s.role || "admin") === "analyste"
                        ? "bg-secondary text-secondary-foreground"
                        : "border border-primary/30 bg-accent text-accent-foreground"
                    }`}
                  >
                    {DELEGATED_ROLES[s.role || "admin"].label}
                  </span>
                  {isFounder && (
                    <select
                      value={s.role || "admin"}
                      onChange={(e) => changeRole(s, e.target.value)}
                      disabled={busy}
                      className="h-8 rounded-full border border-input bg-surface px-2 text-xs"
                      aria-label="Changer le rôle"
                    >
                      {Object.entries(DELEGATED_ROLES).map(([k, r]) => (
                        <option key={k} value={k}>{r.label}</option>
                      ))}
                    </select>
                  )}
                  {isFounder && (
                    <button
                      onClick={() => remove(s)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-expense-soft hover:text-expense disabled:opacity-50"
                      aria-label="Révoquer l'accès"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFounder ? (
        <form onSubmit={add} className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4" /> Inviter un collaborateur interne
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Adresse email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@kolo.app"
              />
            </div>
            <div className="space-y-1.5 sm:w-56">
              <Label className="text-xs uppercase text-muted-foreground">Rôle et accès</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 w-full rounded-full border border-input bg-surface px-3 text-sm"
              >
                {Object.entries(DELEGATED_ROLES).map(([k, r]) => (
                  <option key={k} value={k}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Ajouter
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          Seuls les fondateurs peuvent inviter des collaborateurs ou modifier les rôles.
        </p>
      )}
    </div>
  );
}