import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      {/* Retour vers la page d'accueil */}
      <Link
        to="/"
        className="absolute left-4 top-4 flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à l'accueil
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image
            src={LOGO_URL}
            alt="Kolo"
            className="inline-block w-16 h-16 rounded-2xl object-cover mb-3 shadow-sm"
          />
          <div className="font-heading text-lg font-semibold tracking-tight mb-1">Kolo</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}