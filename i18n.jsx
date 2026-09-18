import { useState, useEffect } from "react";

// Mini i18n plateforme : le sélecteur de langue de l'en-tête traduit la
// navigation et les libellés principaux de l'interface (FR / EN).
const DICT = {
  fr: {},
  en: {
    // Sections
    "Général": "General",
    "Analyse": "Analytics",
    "Gestion": "Management",
    "Foyer & outils": "Household & tools",
    "Administration": "Administration",
    // Navigation
    "Tableau de bord": "Dashboard",
    "Transactions": "Transactions",
    "Calendrier": "Calendar",
    "Rapports annuels": "Annual reports",
    "Analyse mensuelle": "Monthly analysis",
    "Répartition dépenses": "Spending breakdown",
    "Flux de trésorerie": "Cash flow",
    "Comptes": "Accounts",
    "Budgets": "Budgets",
    "Objectifs épargne": "Savings goals",
    "Dettes": "Debts",
    "Récurrences": "Recurring",
    "Catégories": "Categories",
    "Gestion des membres": "Members",
    "Notifications": "Notifications",
    "Profil": "Profile",
    "Exporter données": "Export data",
    "Réglages": "Settings",
    "Abonnement": "Subscription",
    "Aide & support": "Help & support",
    "Super Admin": "Super Admin",
    // Libellés courts (nav mobile)
    "Accueil": "Home",
    "Rapports": "Reports",
    "Analyse": "Analysis",
    "Répartition": "Breakdown",
    "Flux": "Cash flow",
    "Objectifs": "Goals",
    "Membres": "Members",
    "Notifs": "Alerts",
    "Exporter": "Export",
    // En-tête
    "Foyer": "Household",
    "Patrimoine": "Net worth",
    "Ce mois": "This month",
    "Transaction": "Transaction",
    "Se déconnecter": "Log out",
  },
};

let currentLang = "fr";
try {
  currentLang = localStorage.getItem("kolo_lang") || "fr";
} catch (e) {
  /* stockage indisponible */
}

const listeners = new Set();

export function setLang(l) {
  currentLang = l === "en" ? "en" : "fr";
  try {
    localStorage.setItem("kolo_lang", currentLang);
  } catch (e) {
    /* stockage indisponible */
  }
  listeners.forEach((fn) => fn(currentLang));
}

export function useI18n() {
  const [lang, setLocal] = useState(currentLang);
  useEffect(() => {
    const fn = (v) => setLocal(v);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const t = (key) => (DICT[lang] && DICT[lang][key]) || key;
  return { lang, setLang, t };
}