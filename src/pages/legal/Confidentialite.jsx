import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="à valider par un juriste avant mise en production">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Brouillon décrivant fidèlement les données réellement traitées par Kolo aujourd'hui — à
        faire valider par un professionnel du droit avant mise en production, notamment pour la
        base légale de chaque traitement et les durées de conservation.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Email, mot de passe (stocké haché, jamais en clair), nom.</li>
        <li>
          Données financières que vous saisissez vous-même : comptes, transactions, budgets,
          dettes, objectifs d'épargne — rattachées à votre foyer.
        </li>
        <li>Adresse IP et user-agent, uniquement pour la sécurité (limitation des tentatives de connexion).</li>
      </ul>

      <h2>Isolation entre foyers</h2>
      <p>
        Vos données financières sont strictement isolées par foyer au niveau de la base de données
        (politiques de sécurité au niveau des lignes / Row-Level Security). Aucun autre foyer n'y a
        accès.
      </p>

      <h2>Partage avec des tiers</h2>
      <p>
        Vos données ne sont ni vendues ni partagées à des fins publicitaires. Elles peuvent
        transiter par nos sous-traitants techniques (hébergement Cloudflare, base de données Neon)
        strictement pour faire fonctionner le service. Si vous activez l'assistant IA, votre
        question et le contexte fourni sont envoyés à Anthropic (fournisseur du modèle) pour
        générer une réponse.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et
        de portabilité de vos données. Vous pouvez exporter vos données depuis les paramètres de
        l'application, ou nous contacter à contact@kolo.app pour toute demande.
      </p>

      <h2>Suppression de compte</h2>
      <p>
        La suppression de votre compte entraîne la suppression de vos données personnelles, sous
        réserve des obligations légales de conservation le cas échéant.
      </p>
    </LegalLayout>
  );
}
