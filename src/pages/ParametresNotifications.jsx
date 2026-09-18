import { db } from "@/api/client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Loader2, Mail, Save, Gauge } from "lucide-react";

const NOTIF_TYPES = [
  { key: "budget_warning", label: "Alerte à X % du budget", desc: "Prévention avant dépassement du plafond mensuel." },
  { key: "budget_exceeded", label: "Budget dépassé", desc: "Notification dès que le plafond est franchi." },
  { key: "recurring_due", label: "Échéances récurrentes", desc: "Factures et abonnements à venir ou en retard." },
  { key: "trial_ending", label: "Fin d'essai", desc: "Rappel avant la fin de votre essai gratuit." },
];

const CHANNELS = [
  { key: "in_app", label: "In-app", desc: "Alertes dans le centre de notifications de Kolo.", icon: Bell },
  { key: "email", label: "Email", desc: "Résumé des alertes envoyé sur votre adresse.", icon: Mail },
];

export default function ParametresNotifications() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();

  const [threshold, setThreshold] = useState(80);
  const [types, setTypes] = useState({});
  const [channels, setChannels] = useState({ in_app: true, email: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = user?.data || {};
    setThreshold(Number(d.notif_threshold ?? 80));
    setTypes(d.notif_types || {});
    setChannels(d.notif_channels || { in_app: true, email: false });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await db.auth.updateMe({
        notif_threshold: threshold,
        notif_types: types,
        notif_channels: channels,
      });
      await checkUserAuth();
      toast({ title: "Préférences enregistrées" });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Bell className="h-5 w-5" /> Préférences de notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez vos seuils d'alerte et choisissez les notifications que vous souhaitez recevoir.
        </p>
      </div>

      {/* Seuil d'alerte budget */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-warning" /> Seuil d'alerte budget
        </div>
        <div className="space-y-3">
          <Slider
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            min={50}
            max={100}
            step={5}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Alerte dès que {threshold} % du plafond mensuel est consommé
            </span>
            <span className="font-mono-nums font-semibold">{threshold} %</span>
          </div>
        </div>
      </div>

      {/* Types de notifications */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
        <div className="text-sm font-semibold mb-2">Types d'alertes</div>
        {NOTIF_TYPES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {t.key === "budget_warning" ? t.label.replace("X", threshold) : t.label}
              </div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </div>
            <Switch
              checked={types[t.key] !== false}
              onCheckedChange={(v) => setTypes((s) => ({ ...s, [t.key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Canaux de réception */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
        <div className="text-sm font-semibold mb-2">Canaux de réception</div>
        {CHANNELS.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-4 py-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <c.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
              </div>
            </div>
            <Switch
              checked={channels[c.key] !== false}
              onCheckedChange={(v) => setChannels((s) => ({ ...s, [c.key]: v }))}
            />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
        Enregistrer
      </Button>
    </div>
  );
}