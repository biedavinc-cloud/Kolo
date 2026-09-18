import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Bandeau final d'incitation à l'inscription
export default function CtaSection() {
  return (
    <section className="px-5 pb-20 pt-4 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-6xl rounded-3xl bg-gray-950 px-6 py-14 text-center sm:px-12 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Prêt à reprendre le contrôle, en famille ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
          Créez votre foyer en moins de deux minutes. 7 jours d'essai gratuit, sans carte bancaire.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Créer mon foyer <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Voir les tarifs
          </a>
        </div>
      </div>
    </section>
  );
}