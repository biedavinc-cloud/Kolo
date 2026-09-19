import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";

export default function LegalLayout({ title, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Image src={LOGO_URL} alt="Kolo" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-heading text-base font-bold tracking-tight text-slate-900">Kolo</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : {updatedAt}</p>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-gray-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  );
}
