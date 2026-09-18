import { db } from "@/api/client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";
import { useInvalidateAll } from "@/lib/useFinanceData";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import CurrencySelect from "@/components/CurrencySelect";
import InvitationCard from "@/components/InvitationCard";
import { Loader2, Settings as SettingsIcon, Camera, User } from "lucide-react";

export default function Settings() {
  const { user, checkUserAuth } = useAuth();
  const { household, reload } = useHousehold(user);
  const invalidate = useInvalidateAll(user);
  const { toast } = useToast();

  const [name, setName] = useState(household?.name || "");
  const [currency, setCurrency] = useState(household?.currency || "EUR");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = user?.data?.avatar_url;
  const initials = (user?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (household) {
      setName(household.name);
      setCurrency(household.currency || "EUR");
    }
  }, [household]);

  const saveHousehold = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.entities.Household.update(household.id, { name: name.trim(), currency });
      reload();
      invalidate();
      toast({ title: "Foyer mis à jour" });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Photo de profil : téléversement automatique, mise à jour instantanée partout
  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "Choisissez un fichier de moins de 3 Mo.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadPublicFile({ file });
      await db.auth.updateMe({ avatar_url: file_url });
      await checkUserAuth();
      toast({ title: "Photo de profil mise à jour", description: "Visible partout dans l'application." });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" /> Réglages
        </h1>
        <p className="text-sm text-muted-foreground">Votre profil et la configuration du foyer</p>
      </div>

      {/* Profil : photo automatique */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">Mon profil</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Photo de profil" />}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Ajouter / changer ma photo"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {user?.data?.display_name || user?.full_name || "Membre"}
            </div>
            <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cliquez sur l'appareil photo : la photo s'applique automatiquement partout.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 mt-3" onClick={() => (window.location.href = "/profil")}>
          <User className="h-3.5 w-3.5 mr-1.5" /> Voir mon profil
        </Button>
      </div>

      {/* Foyer */}
      <form onSubmit={saveHousehold} className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <h3 className="text-sm font-semibold">Foyer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Devise</Label>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </form>

      <InvitationCard />
    </div>
  );
}