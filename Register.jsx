const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import PhoneInput from "@/components/PhoneInput";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { detectDialCode } from "@/lib/phoneCountries";

// Inscription : profil complet obligatoire (nom, téléphone international) puis vérification OTP
export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState({ country: "", number: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const inviteCode = new URLSearchParams(window.location.search).get("code");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!fullName.trim() || !phone.number.trim()) {
      setError("Merci de renseigner votre nom et votre numéro de téléphone.");
      return;
    }
    setLoading(true);
    try {
      await db.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await db.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        db.auth.setToken(result.access_token);
      }
      // Profil complet dès la création du compte (reprise à l'onboarding si échec)
      try {
        await db.auth.updateMe({
          display_name: fullName.trim(),
          phone_country_code: phone.country || detectDialCode(),
          phone_number: phone.number.replace(/\s+/g, ""),
        });
      } catch (profileErr) {
        console.warn("Profil non enregistré, complété à l'onboarding");
      }
      window.location.href = inviteCode
        ? `/onboarding?code=${encodeURIComponent(inviteCode)}`
        : safeReturnTo();
    } catch (err) {
      setError(err.message || "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await db.auth.resendOtp(email);
      toast({
        title: "Code envoyé",
        description: "Consultez votre email pour le nouveau code.",
      });
    } catch (err) {
      setError(err.message || "Échec de l'envoi du code");
    }
  };

  const handleGoogle = () => db.auth.loginWithProvider("google", safeReturnTo());
  const handleApple = () => db.auth.loginWithProvider("apple", safeReturnTo());

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Vérifiez votre email" subtitle={`Nous avons envoyé un code à ${email}`}>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <div className="mb-6 flex justify-center">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="h-12 w-full font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…
            </>
          ) : (
            "Vérifier"
          )}
        </Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pas de code reçu ?{" "}
          <button onClick={handleResend} className="font-medium text-primary hover:underline">
            Renvoyer
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Créer votre compte"
      subtitle="Quelques informations pour démarrer avec votre foyer"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="outline" className="h-12 text-sm font-medium" onClick={handleGoogle}>
          <GoogleIcon className="mr-2 h-5 w-5" /> Google
        </Button>
        <Button variant="outline" className="h-12 text-sm font-medium" onClick={handleApple}>
          <AppleIcon className="mr-2 h-5 w-5" /> Apple
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Awa Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <PhoneInput id="phone" value={phone} onChange={setPhone} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 pl-10"
                required
              />
            </div>
          </div>
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création du compte…
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}