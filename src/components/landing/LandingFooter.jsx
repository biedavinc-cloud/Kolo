import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Instagram } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      ["Fonctionnalités", "#features"],
      ["Nos offres", "#pricing"],
      ["Sécurité", "#security"],
    ],
  },
  {
    title: "Légal",
    links: [
      ["Mentions légales", "/mentions-legales"],
      ["Politique de confidentialité", "/confidentialite"],
      ["CGU", "/cgu"],
    ],
  },
];

function FooterLink({ href, children }) {
  const className = "text-sm text-gray-400 transition-colors hover:text-white";
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export default function LandingFooter() {
  return (
    <footer className="bg-[#232f3e] px-5 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src={LOGO_URL} alt="Kolo" className="h-12 w-12 rounded-2xl object-cover" />
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text font-heading text-2xl font-bold tracking-tight text-transparent">
                Kolo
              </span>
            </div>
            <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-gray-400">
              La finance familiale, collaborative et sécurisée.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a href="#" aria-label="LinkedIn" className="text-gray-400 transition-colors hover:text-white">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 transition-colors hover:text-white">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Kolo. Tous droits réservés.</p>
          <Link to="/login" className="text-xs text-gray-400 transition-colors hover:text-white">
            Espace membre
          </Link>
        </div>
      </div>
    </footer>
  );
}
