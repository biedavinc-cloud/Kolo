import React, { useState } from "react";
import { Link } from "react-router-dom";
import HeroPhones from "./HeroPhones";
import InstallCard from "./InstallCard";
import JoinDialog from "./JoinDialog";

// Hero conforme à la maquette Bankin' : dégradé bleu fourni par le conteneur
// dans Landing.jsx, téléphones flottants, titre blanc et carte QR flottante.
export default function Hero() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-10 sm:px-6 sm:pb-24">
      <HeroPhones />

      <h1 className="mx-auto mt-10 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
        L'app tout-en-un pour mieux gérer l'argent de votre foyer
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-base font-medium text-white/85 sm:text-lg">
        Tous les comptes de votre foyer, 1 seule app, 0 stress.
      </p>

      <InstallCard />

      <div className="mt-6 flex flex-col items-center justify-center gap-1.5 text-center sm:flex-row sm:gap-4">
        <Link
          to="/register"
          className="text-sm font-semibold text-white underline underline-offset-4 transition-colors hover:text-white/80"
        >
          ou commencez gratuitement sur le web →
        </Link>
        <button
          onClick={() => setJoinOpen(true)}
          className="text-sm font-semibold text-white/80 underline underline-offset-4 transition-colors hover:text-white"
        >
          Rejoindre un foyer avec un code
        </button>
      </div>

      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </section>
  );
}