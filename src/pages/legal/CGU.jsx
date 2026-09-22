import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";

export default function CGU() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" updatedAt="à valider par un juriste avant mise en production">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Brouillon — à faire valider par un professionnel du droit avant mise en production.
      </p>

      <h2>Objet</h2>
      <p>
        Kolo est une application de gestion financière familiale permettant de suivre comptes,
        transactions, budgets, dettes et objectifs d'épargne au sein d'un foyer.
      </p>

      <h2>Compte et foyer</h2>
      <p>
        L'utilisation de Kolo nécessite la création d'un compte, puis la création ou la jointure
        d'un foyer via un code d'invitation. Chaque membre du foyer accède aux données de ce foyer
        selon son rôle.
      </p>

      <h2>Essai gratuit et abonnement</h2>
      <p>
        Chaque foyer bénéficie d'une période d'essai gratuite (7 jours). Passé ce délai, l'accès
        aux fonctionnalités payantes nécessite la souscription d'un des plans proposés. Les tarifs
        et fonctionnalités de chaque plan sont indiqués sur la page des offres.
      </p>

      <h2>Usage responsable</h2>
      <p>
        Kolo n'est ni un établissement bancaire, ni un conseiller financier agréé. Les informations
        et analyses fournies (y compris par l'assistant IA) sont indicatives et ne constituent pas
        un conseil en investissement.
      </p>

      <h2>Résiliation</h2>
      <p>
        Vous pouvez cesser d'utiliser Kolo et demander la suppression de votre compte à tout
        moment, sans engagement de durée.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question : contact@kolo.liafrik.com</p>
    </LegalLayout>
  );
}
