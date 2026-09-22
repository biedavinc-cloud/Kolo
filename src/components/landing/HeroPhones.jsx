import React from "react";
import { motion } from "framer-motion";

// Vraie capture d'écran de l'app Kolo, tenue en main — remplace les deux
// maquettes de téléphone illustrées précédentes.
export default function HeroPhones() {
  return (
    <div className="relative mx-auto mt-8 flex max-w-lg items-end justify-center sm:mt-4">
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-full bg-white/30 blur-2xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <img
          src="/images/hero-phone-mockup.webp"
          alt="L'application Kolo affichant le flux de trésorerie prévisionnel du foyer"
          className="w-[340px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.35)] sm:w-[460px] lg:w-[520px]"
        />
      </motion.div>
    </div>
  );
}
