import React from "react";
import { motion } from "framer-motion";

// Vraie capture d'écran de l'app Kolo, tenue en main — remplace les deux
// maquettes de téléphone illustrées précédentes.
export default function HeroPhones() {
  return (
    <div className="relative mx-auto mt-12 flex max-w-md items-end justify-center">
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-20 w-[70%] -translate-x-1/2 rounded-full bg-white/30 blur-2xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <img
          src="/images/hero-phone-mockup.webp"
          alt="L'application Kolo affichant le flux de trésorerie prévisionnel du foyer"
          className="w-[260px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.35)] sm:w-[320px]"
        />
      </motion.div>
    </div>
  );
}
