const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMembers } from "@/lib/useFinanceData";
import { useHousehold } from "@/lib/useHousehold";
import { isSuperAdmin } from "@/lib/superAdmins";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import InvitationCard from "@/components/InvitationCard";
import { Users, ShieldCheck, UserMinus, Crown } from "lucide-react";

// Gestion des membres du foyer : consultation, rôles, accès et invitations
// par email / token. Réservée aux administrateurs pour les actions sensibles.
export default function GestionMembres() {
  const { user } = useAuth();
  const { household } = useHousehold(user);
  const { data: members = [], refetch } = useMembers(user);
  const { toast } = useToast();
  const canManage = isSuperAdmin(user);

  const changeRole = async (m, role) => {
    try {
      await db.entities.User.update(m.id, { role });
      toast({
        title: "Rôle mis à jour",
        description: `${m.email} est maintenant ${role === "admin" ? "administrateur" : "utilisateur"}.`,
      });
      refetch();
    } catch {
      toast({
        title: "Action refusée",
        description: "Votre compte doit avoir le rôle administrateur de l'application pour changer les rôles.",
        variant: "destructive",
      });
    }
  };

  const removeFromHousehold = async (m) => {
    try {
      await db.entities.User.update(m.id, {
        data: { ...(m.data || {}), household_id: null },
      });
      toast({
        title: "Membre retiré du foyer",
        description: `${m.email} devra créer ou rejoindre un foyer à sa prochaine connexion.`,
      });
      refetch();
    } catch {
      toast({
        title: "Action refusée",
        description: "Impossible de retirer ce membre. Vérifiez vos droits d'administrateur.",
        variant: "destructive",
      });
    }
  };

  const initials = (m) => (m?.full_name || m?.email || "?").slice(0, 2).toUpperCase();
  const displayName = (m) => m?.data?.display_name || m?.full_name || m?.email || "Membre";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Users className="h-5 w-5" /> Gestion des membres
        </h1>
        <p className="text-sm text-muted-foreground">
          Membres du foyer, rôles, accès et invitations par email ou code d'invitation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Membres du foyer ({members.length})</h3>
        <div className="space-y-2">
          {members.map((m) => {
            const superAdmin = isSuperAdmin(m);
            const isOwner = m.id === household?.created_by_id;
            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-xl border border-border px-3 py-2.5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {m.data?.avatar_url && <AvatarImage src={m.data.avatar_url} alt={displayName(m)} />}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {initials(m)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate text-sm font-medium">
                      {displayName(m)}
                      {superAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <ShieldCheck className="h-3 w-3" /> Super Admin
                        </span>
                      )}
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">
                          <Crown className="h-3 w-3" /> Admin du foyer
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canManage && !superAdmin && m.id !== user.id ? (
                    <select
                      value={m.role || "user"}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="h-8 rounded-full border border-input bg-surface px-3 text-xs"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {m.role === "admin" ? "Administrateur" : "Utilisateur"}
                    </span>
                  )}
                  {canManage && !superAdmin && m.id !== user.id && !isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromHousehold(m)}
                      className="h-8 rounded-full px-3 text-xs text-expense hover:bg-expense-soft hover:text-expense"
                    >
                      <UserMinus className="mr-1 h-3.5 w-3.5" />
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun membre trouvé.</p>
          )}
        </div>
      </div>

      <InvitationCard />
    </div>
  );
}