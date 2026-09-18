import { db } from "@/api/client";
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

import { createHousehold, joinHousehold, getHouseholdId } from "@/lib/useHousehold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, UserPlus, Check } from "lucide-react";
import CurrencySelect from "@/components/CurrencySelect";
import PhoneInput from "@/components/PhoneInput";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import { cn } from "@/lib/utils";

const STEPS = ["Profil", "Foyer"];

// Onboarding pro en 2 étapes : profil complet obligatoire, puis création ou rejointe du foyer
export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();

  const profileComplete = !!(user?.data?.display_name && user?.data?.phone_number);
  const [step, setStep] = useState(profileComplete ? 1 : 0);
  const [displayName, setDisplayName] = useState(user?.data?.display_name || user?.full_name || "");
  const [phone, setPhone] = useState({
    country: user?.data?.phone_country_code || "",
    number: user?.data?.phone_number || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Pré-remplissage via ?code= (token d'invitation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) {
      setCode(c);
      setMode("join");
    }
  }, []);

  if (getHouseholdId(user)) {
    return <Navigate to="/" replace />;
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || !phone.number.trim()) return;
    setSavingProfile(true);
    try {
      await db.auth.updateMe({
        display_name: displayName.trim(),
        phone_country_code: phone.country,
        phone_number: phone.number.replace(/\s+/g, ""),
      });
      await checkUserAuth();
      setStep(1);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createHousehold(name.trim(), currency);
      toast({ title: "Foyer créé", description: "Bienvenue sur Kolo" });
      window.location.href = "/";
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      await joinHousehold(code);
      toast({ title: "Foyer rejoint" });
      window.location.href = "/";
    } catch (err) {
      toast({ title: "Code invalide", description: "Vérifiez le token d'invitation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <Image src={LOGO_URL} alt="Kolo" className="h-10 w-10 rounded-xl object-cover" />
        <span className="font-heading text-xl font-semibold tracking-tight">Kolo</span>
      </div>

      <div className="w-full max-w-md">
        {/* Indicateur d'étapes */}
        <ol className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium", i <= step ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">Votre profil</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Ces informations permettent à votre foyer de vous reconnaître. Tous les champs sont requis.
            </p>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ob-name">Nom complet</Label>
                <Input
                  id="ob-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Awa Dupont"
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ob-phone">Téléphone</Label>
                <PhoneInput id="ob-phone" value={phone} onChange={setPhone} required />
              </div>
              <Button
                type="submit"
                disabled={savingProfile}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuer
              </Button>
            </form>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">
              Bienvenue{displayName ? `, ${displayName.split(" ")[0]}` : ""}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Créez un foyer familial ou rejoignez-en un existant avec votre token d'invitation.
            </p>

            {!mode && (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setMode("create")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Créer un foyer</div>
                    <div className="text-sm text-muted-foreground">Démarrez un nouvel espace familial</div>
                  </div>
                </button>
                <button
                  onClick={() => setMode("join")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Rejoindre un foyer</div>
                    <div className="text-sm text-muted-foreground">Saisissez le token d'invitation reçu</div>
                  </div>
                </button>
              </div>
            )}

            {mode === "create" && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="h-name">Nom du foyer</Label>
                  <Input
                    id="h-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Famille Dupont"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="h-currency">Devise par défaut</Label>
                  <CurrencySelect id="h-currency" value={currency} onChange={setCurrency} />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le foyer
                </Button>
                <button type="button" onClick={() => setMode(null)} className="w-full text-sm text-muted-foreground hover:text-foreground">
                  Retour
                </button>
              </form>
            )}

            {mode === "join" && (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="h-code">Token d'invitation</Label>
                  <Input
                    id="h-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Collez le token reçu"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Le token vous a été communiqué par le créateur du foyer.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Rejoindre
                </Button>
                <button type="button" onClick={() => setMode(null)} className="w-full text-sm text-muted-foreground hover:text-foreground">
                  Retour
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}