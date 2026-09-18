import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarDays,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Wallet,
  PiggyBank,
  Target,
  Landmark,
  Repeat,
  Tags,
  Users,
  User,
  Download,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

const FEATURES = [
  { to: "/", icon: LayoutDashboard, title: "Tableau de bord", desc: "Vue d'ensemble : patrimoine net, revenus, dépenses et budgets du mois." },
  { to: "/transactions", icon: ArrowLeftRight, title: "Transactions", desc: "Saisissez, filtrez, modifiez toutes les opérations du foyer. Raccourci « T » pour un ajout rapide." },
  { to: "/calendrier", icon: CalendarDays, title: "Calendrier financier", desc: "Visualisez les transactions passées et les paiements récurrents à venir, jour par jour." },
  { to: "/comptes", icon: Wallet, title: "Comptes", desc: "Comptes courants, épargne, espèces ou crédit : suivez tous les soldes." },
  { to: "/budgets", icon: PiggyBank, title: "Budgets", desc: "Fixez un plafond mensuel par catégorie et suivez votre consommation." },
  { to: "/objectifs", icon: Target, title: "Objectifs épargne", desc: "Définissez des objectifs avec échéance et suivez la progression." },
  { to: "/dettes", icon: Landmark, title: "Dettes", desc: "Suivez les remboursements et estimez la date de libération totale." },
  { to: "/recurring", icon: Repeat, title: "Récurrences", desc: "Loyer, salaire, abonnements : enregistrez-les une fois, ils se répètent." },
  { to: "/categories", icon: Tags, title: "Catégories", desc: "Organisez vos postes de dépenses et de revenus." },
  { to: "/rapports", icon: BarChart3, title: "Rapports annuels", desc: "Évolution des revenus et dépenses sur toute l'année." },
  { to: "/analyse-mensuelle", icon: LineChart, title: "Analyse mensuelle", desc: "Comparez vos mois et identifiez les tendances de consommation." },
  { to: "/repartition-depenses", icon: PieChart, title: "Répartition dépenses", desc: "Quels postes budgétaires consomment le plus ? Réponse en secteurs." },
  { to: "/flux-tresorerie", icon: TrendingUp, title: "Flux de trésorerie", desc: "Prévision du solde bancaire basée sur vos revenus et charges récurrents." },
  { to: "/gestion-membres", icon: Users, title: "Gestion des membres", desc: "Gérez les membres du foyer, leurs rôles et les invitations." },
  { to: "/export-donnees", icon: Download, title: "Exporter", desc: "Téléchargez l'historique complet de vos transactions en CSV." },
  { to: "/profil", icon: User, title: "Profil", desc: "Nom, photo et préférences d'affichage." },
];

const TIPS = [
  "Notez chaque dépense le jour même : la saisie prend moins de 15 secondes avec le bouton « Transaction » (ou la touche T).",
  "Créez d'abord vos comptes, puis vos catégories : toutes les pages s'appuient dessus.",
  "Fixez un budget pour les catégories sensibles (courses, restaurants) et consultez le tableau de bord chaque semaine.",
  "Enregistrez vos revenus et charges fixes en récurrences : le calendrier et le flux de trésorerie se remplissent tout seuls.",
  "Fixez un objectif d'épargne mensuel dans « Objectifs » et alimentez-le dès la réception du salaire.",
  "En fin de mois, exportez vos données en CSV pour garder une trace hors ligne.",
];

const FAQ = [
  {
    q: "Comment inviter un membre de ma famille ?",
    a: "Seuls les super administrateurs peuvent donner accès à la plateforme. Depuis la page Membres, saisissez l'email de la personne : elle reçoit une invitation. Partagez-lui ensuite le code du foyer pour qu'elle rejoigne vos données.",
  },
  {
    q: "Comment rejoindre un foyer ?",
    a: "Après votre inscription, saisissez le code du foyer fourni par un administrateur sur la page d'accueil de l'application.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Oui. Chaque foyer est isolé : les membres ne voient que les données de leur propre foyer.",
  },
  {
    q: "Puis-je récupérer mes données ?",
    a: "Oui, la page Exporter permet de télécharger tout l'historique des transactions au format CSV.",
  },
];

export default function Aide() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-5 w-5" /> Aide & Support
        </h1>
        <p className="text-sm text-muted-foreground">
          Découvrez les fonctionnalités principales et comment gérer efficacement votre budget au
          quotidien.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Fonctionnalités</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="rounded-lg border border-border bg-surface p-3.5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <f.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{f.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" /> Bien gérer son budget au quotidien
        </h2>
        <ul className="space-y-2">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="font-mono-nums text-primary font-semibold">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold mb-2">Questions fréquentes</h2>
        <div className="divide-y divide-border">
          {FAQ.map((item, i) => (
            <details key={i} className="group py-2.5">
              <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between">
                {item.q}
                <span className="text-muted-foreground text-xs group-open:hidden">Voir</span>
                <span className="text-muted-foreground text-xs hidden group-open:inline">Fermer</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}