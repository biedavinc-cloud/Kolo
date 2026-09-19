import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="à compléter avant mise en production">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Brouillon : les informations d'identification de l'éditeur ci-dessous sont à compléter avec
        les données réelles de votre société (raison sociale, SIRET, adresse du siège, directeur de
        la publication, hébergeur) avant publication.
      </p>

      <h2>Éditeur du site</h2>
      <p>
        Le site et l'application Kolo sont édités par [Raison sociale à compléter], [forme
        juridique], au capital de [montant] €, immatriculée au RCS de [ville] sous le numéro
        [SIRET], dont le siège social est situé [adresse].
        <br />
        Directeur de la publication : [nom].
        <br />
        Contact : contact@kolo.app
      </p>

      <h2>Hébergement</h2>
      <p>
        L'application est hébergée par Cloudflare, Inc. (statique et fonctions serveur) et la base
        de données par Neon, Inc. (PostgreSQL).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments du site et de l'application Kolo (textes, graphismes, logo,
        interface) est protégé par le droit d'auteur, sauf mention contraire. Toute reproduction
        non autorisée est interdite.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question relative à ces mentions légales : contact@kolo.app</p>
    </LegalLayout>
  );
}
