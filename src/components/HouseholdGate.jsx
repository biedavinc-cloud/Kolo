import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getHouseholdId } from "@/lib/useHousehold";

// Portail : si l'utilisateur n'appartient à aucun foyer, on l'envoie sur l'onboarding.
export default function HouseholdGate() {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  if (!getHouseholdId(user)) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}