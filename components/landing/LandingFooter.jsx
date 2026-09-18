import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Instagram } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";

const COLUMNS = [
  {
    title: "NOUS",
    links: [
      ["Nos engagements", "#features"],
      ["Espace presse", "#features"],
      ["Jobs", "#features"],
    ],
  },
  {
    title: "PRODUITS",
    links: [
      ["App iOS", "#"],
      ["App Android", "#"],
      ["Premium", "#pricing"],
    ],
  },
  {
    title: "OFFRES & SERVICES",
    links: [
      ["Partenariat & Cashback", "#"],
      ["Solutions Data", "#"],
      ["Contact", "#security"],
    ],
  },
  {
    title: "SOCIAL",
    links: [["Blog", "#"]],
  },
  {
    title: "AUTRES",
    links: [
      ["Mentions légales", "#"],
      ["Politique de confidentialité", "#"],
      ["Politique de cookies", "#"],
      ["CGU", "#"],
      ["Support", "#security"],
    ],
  },
];

// Footer conforme à la maquette : fond ardoise, logo cyan, 5 colonnes, tag COOKIES
export default function LandingFooter() {
  return (
    <footer className="bg-[#232f3e] px-5 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image src={LOGO_URL} alt="Kolo" className="h-12 w-12 rounded-2xl object-cover" />
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text font-heading text-2xl font-bold tracking-tight text-transparent">
                Kolo
              </span>
            </div>
            <p className="mt-3 max-w-[220px] text-xs leading-relaxed text-gray-400">
              La finance familiale, collaborative et sécurisée.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-white">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-gray-400 transition-colors hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
                {col.title === "SOCIAL" && (
                  <li className="flex items-center gap-3 pt-1">
                    <a href="#" aria-label="LinkedIn" className="text-gray-400 transition-colors hover:text-white">
                      <Linkedin className="h-4 w-4" />
                    </a>
                    <a href="#" aria-label="Instagram" className="text-gray-400 transition-colors hover:text-white">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <button className="rounded-md bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-black">
            Cookies
          </button>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Kolo —{" "}
            <Link to="/login" className="transition-colors hover:text-white">
              Espace membre
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}