import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import PricingPlans from "@/components/PricingPlans";
import TrustSection from "@/components/landing/TrustSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

// Landing publique Kolo — hero fintech façon Bankin' (dégradé bleu, téléphones flottants)
export default function Landing() {
  const { user, isLoadingAuth } = useAuth();

  // Utilisateur déjà connecté → directement vers l'application
  if (!isLoadingAuth && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen scroll-smooth bg-white font-sans text-gray-900 antialiased selection:bg-gray-900 selection:text-white">
      {/* Bloc hero bleu : nav + téléphones + titre + carte QR */}
      <div
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 50% 0%, rgba(74,144,226,0.88) 0%, rgba(137,207,240,0.82) 80%), url('/images/hero-family.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
      >
        <LandingNav />
        <Hero />
      </div>

      <main>
        <FeatureGrid />
        <section id="pricing" className="border-t border-gray-100 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Un plan pour chaque foyer
              </h2>
              <p className="mt-4 text-gray-500">
                Commencez par 7 jours gratuits, sans carte bancaire. Après l'essai, choisissez le plan
                qui correspond à votre famille.
              </p>
            </div>
            <PricingPlans />
          </div>
        </section>
        <TrustSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}