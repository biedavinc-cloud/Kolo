import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { User, Camera, Loader2, LogOut, Sun, Moon, Monitor } from "lucide-react";

export default function Profil() {
  const { user, checkUserAuth, logout } = useAuth();
  const { household } = useHousehold(user);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(
    user?.data?.display_name || user?.full_name || ""
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = user?.data?.avatar_url;
  const email = user?.email || "";
  const initials = (user?.full_name || email || "?").slice(0, 2).toUpperCase();

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await db.auth.updateMe({ display_name: displayName.trim() });
      await checkUserAuth();
      toast({ title: "Profil enregistré" });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: "Choisissez un fichier de moins de 3 Mo.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadPublicFile({ file });
      await db.auth.updateMe({ avatar_url: file_url });
      await checkUserAuth();
      toast({ title: "Photo de profil mise à jour" });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const themeOptions = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "system", label: "Système", icon: Monitor },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <User className="h-5 w-5" /> Profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre nom, votre image de profil et vos préférences d'affichage.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Photo de profil" />}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Changer la photo"
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
                onChange={onFileChange}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <div className="text-base font-medium">
              {user?.data?.display_name || user?.full_name || "Membre"}
            </div>
            <div className="text-sm text-muted-foreground truncate">{email}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Foyer : {household?.name || "—"}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold">Informations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Nom affiché</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Email (non modifiable)</Label>
            <Input value={email} readOnly className="text-muted-foreground" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold">Préférences d'affichage</h3>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <Button variant="outline" onClick={() => logout()} className="h-9 text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1.5" /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}