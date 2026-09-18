import React from "react";
import { Wrench } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";

// Page de maintenance affichée quand le Super Admin active le mode maintenance
export default function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Image src={LOGO_URL} alt="Kolo" className="h-12 w-12 rounded-xl object-cover" />
      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-soft text-warning">
        <Wrench className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Maintenance en cours</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Kolo est momentanément indisponible pour une amélioration de la plateforme. Vos données sont
        conservées en sécurité — revenez très bientôt.
      </p>
    </div>
  );
}