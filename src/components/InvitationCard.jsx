const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";
import { useIsSuperAdmin, SUPER_ADMIN_EMAILS } from "@/lib/superAdmins";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Mail, Loader2, Check, UserPlus, ShieldCheck } from "lucide-react";

export default function InvitationCard() {
  const { user } = useAuth();
  const { household } = useHousehold(user);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const canInvite = useIsSuperAdmin(user);
  const inviteCode = household?.id || "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Code copié" });
    } catch {
      toast({ title: "Copie impossible", variant: "destructive" });
    }
  };

  // Accorde l'accès à l'application (invitation officielle)
  const inviteToApp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      await db.users.inviteUser(email.trim(), role);
      toast({
        title: "Accès accordé",
        description: `${email.trim()} a été invité sur Kolo.`,
      });
      setEmail("");
    } catch (err) {
      toast({
        title: "Invitation impossible",
        description: err.message || "Vérifiez que votre compte a le rôle administrateur.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  // Envoie le code du foyer par email (fonction backend sendInvite)
  const sendCodeEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !household) return;
    setSending(true);
    try {
      await db.functions.invoke("sendInvite", {
        to: email.trim(),
        householdName: household.name,
        inviteCode,
      });
      toast({ title: "Email envoyé", description: email.trim() });
    } catch (err) {
      toast({
        title: "Envoi impossible",
        description:
          "L'email n'a pu être envoyé (destinataire non inscrit ou domaine personnalisé requis).",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!canInvite) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Invitations
        </h3>
        <p className="text-sm text-muted-foreground">
          Seuls les super administrateurs peuvent donner accès à la plateforme et inviter de
          nouveaux membres :{" "}
          {SUPER_ADMIN_EMAILS.map((e, i) => (
            <span key={e} className="font-medium text-foreground">
              {e}
              {i < SUPER_ADMIN_EMAILS.length - 1 ? ", " : ""}
            </span>
          ))}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <UserPlus className="h-4 w-4" /> Inviter un membre
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase text-muted-foreground">Code du foyer</Label>
        <div className="flex gap-2">
          <Input value={inviteCode} readOnly className="font-mono-nums text-sm" />
          <Button type="button" variant="outline" onClick={copyCode} className="h-9">
            {copied ? <Check className="h-4 w-4 text-income" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le membre le saisit à l'inscription pour rejoindre le foyer.
        </p>
      </div>

      <form onSubmit={inviteToApp} className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Inviter sur l'application</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@famille.com"
              className="pl-9"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
          <Button type="submit" disabled={inviting} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
            {inviting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Accorder l'accès
          </Button>
        </div>
        <button
          type="button"
          onClick={sendCodeEmail}
          disabled={sending || !email.trim()}
          className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {sending ? "Envoi en cours…" : "Envoyer aussi le code du foyer par email"}
        </button>
      </form>
    </div>
  );
}