import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight, Globe } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import { useI18n } from "@/lib/i18n";

// Navigation publique — pilule flottante en verre sur le dégradé bleu du hero
export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useI18n();

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border border-black/5 bg-white px-3 shadow-lg shadow-black/10 sm:px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <Image src={LOGO_URL} alt="Kolo" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900">Kolo</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 lg:flex">
          <a
            href="#features"
            className="rounded-full px-3.5 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Fonctionnalités
          </a>
          <a
            href="#pricing"
            className="rounded-full px-3.5 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Nos offres
          </a>
          <a
            href="#security"
            className="rounded-full px-3.5 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Sécurité
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Langue"
              className="h-9 appearance-none rounded-full border border-black/10 bg-white pl-8 pr-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>
          <Link
            to="/login"
            className="hidden h-9 items-center gap-1.5 rounded-full bg-[#0B2FA8] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0A2A8C] hover:shadow-md sm:inline-flex"
          >
            Me connecter
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 rounded-l-3xl">
              <SheetTitle className="sr-only">Menu Kolo</SheetTitle>
              <nav className="mt-2 flex flex-col gap-1">
                <a
                  href="#features"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Fonctionnalités
                </a>
                <a
                  href="#pricing"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Nos offres
                </a>
                <a
                  href="#security"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Sécurité
                </a>
                <div className="my-2 h-px bg-gray-100" />
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-gray-500">Langue</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setLang("fr")}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lang === "fr" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      FR
                    </button>
                    <button
                      onClick={() => setLang("en")}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lang === "en" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      EN
                    </button>
                  </div>
                </div>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#1A1A1A] px-3 py-2.5 text-center text-sm font-medium text-white"
                >
                  Me connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-full px-3 py-2.5 text-center text-sm font-medium text-primary hover:bg-gray-50"
                >
                  Créer un compte
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </div>
  );
}