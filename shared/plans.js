// Source unique des plans d'abonnement Kolo — prix (USD) et limites par plan.
// Importé à la fois par le frontend (src/lib/plans.js, pour l'affichage) et
// le backend (functions/api/_lib, pour l'application réelle des limites) afin
// que les deux ne puissent jamais diverger.
export const TRIAL_DAYS = 7;

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 3,
    tagline: "Pour découvrir Kolo simplement",
    features: [
      "1 compte bancaire",
      "1 membre du foyer",
      "Transactions illimitées",
      "Budgets mensuels de base",
      "Support par email",
    ],
    limits: { accounts: 1, members: 1, ai: false },
  },
  {
    id: "pro",
    name: "Pro",
    price: 14,
    tagline: "Pour les foyers actifs",
    features: [
      "3 comptes bancaires",
      "5 membres du foyer",
      "Budgets personnalisés & copie mensuelle",
      "Rapports annuels et analyses",
      "Export des données",
      "Assistant IA (10 questions/mois)",
    ],
    limits: { accounts: 3, members: 5, ai: true },
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    tagline: "L'expérience Kolo complète",
    popular: true,
    features: [
      "10 comptes bancaires",
      "10 membres du foyer",
      "Assistant IA illimité",
      "Multi-devises voyageur (50+ devises)",
      "Tous les rapports & flux de trésorerie",
      "Objectifs épargne & dettes avancés",
    ],
    limits: { accounts: 10, members: 10, ai: true },
  },
  {
    id: "family",
    name: "Family",
    price: 89,
    tagline: "Pour toute la famille élargie",
    features: [
      "Comptes bancaires illimités",
      "20 membres du foyer",
      "Tout Premium inclus",
      "Gestion multi-foyers",
      "Support prioritaire 7j/7",
      "Coaching financier annuel",
    ],
    limits: { accounts: null, members: 20, ai: true },
  },
];

export function planById(id) {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export function getPlanLimits(id) {
  return planById(id).limits;
}
