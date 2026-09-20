import { sendHouseholdInvite } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Mail, Loader2, Check, UserPlus } from "lucide-react";

export default function InvitationCard() {
  const { user } = useAuth();
  const { household } = useHousehold(user);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tout membre du foyer peut partager le code — ce n'est pas une action
  // sensible, et ce n'est pas réservé aux super administrateurs de la
  // plateforme (une confusion distincte du rôle "administrateur du foyer").
  const inviteCode = household?.invite_code || "";

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

  const sendCodeEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !household) return;
    setSending(true);
    try {
      await sendHouseholdInvite({
        to: email.trim(),
        householdName: household.name,
        inviteCode,
      });
      toast({ title: "Email envoyé", description: email.trim() });
      setEmail("");
    } catch (err) {
      toast({
        title: "Envoi impossible",
        description: err.message || "L'email n'a pu être envoyé.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <UserPlus className="h-4 w-4" /> Inviter un membre
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase text-muted-foreground">Code du foyer</Label>
        <div className="flex gap-2">
          <Input value={inviteCode} readOnly className="font-mono-nums text-sm" />
          <Button type="button" variant="outline" onClick={copyCode} className="h-9" disabled={!inviteCode}>
            {copied ? <Check className="h-4 w-4 text-income" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le membre saisit ce code à l'inscription pour rejoindre le foyer. Vous pourrez ajuster
          son rôle ensuite depuis « Gestion des membres ».
        </p>
      </div>

      <form onSubmit={sendCodeEmail} className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Envoyer le code par email</Label>
        <div className="relative">
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
        <Button
          type="submit"
          disabled={sending || !email.trim()}
          className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {sending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {sending ? "Envoi en cours…" : "Envoyer l'invitation"}
        </Button>
      </form>
    </div>
  );
}
