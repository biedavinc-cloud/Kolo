import React from "react";
import { PauseCircle } from "lucide-react";

// Écran affiché aux membres d'un foyer suspendu par le Super Admin
export default function HouseholdSuspended() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-expense-soft text-expense">
        <PauseCircle className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Foyer temporairement suspendu</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        L'accès à ce foyer a été suspendu par l'administration de Kolo. Contactez le support pour en
        savoir plus. Vos données restent conservées.
      </p>
    </div>
  );
}