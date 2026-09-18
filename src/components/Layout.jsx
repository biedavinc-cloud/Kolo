import { db } from "@/api/client";
import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useHousehold } from "@/lib/useHousehold";
import { useAccounts } from "@/lib/useFinanceData";
import { useUI } from "@/lib/UIContext";
import { useTheme } from "next-themes";
import { formatCurrency, monthKey, monthLabel, convertAmount } from "@/lib/format";
import { useCurrencyEnv } from "@/lib/useCurrency";
import { CURRENCY_GROUPS } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Repeat,
  Settings as SettingsIcon,
  Plus,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Target,
  Landmark,
  Tags,
  User,
  Download,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  Bell,
  Globe,
  LogOut,
  Megaphone,
  Gem,
  ScrollText,
  SlidersHorizontal,
  X } from
"lucide-react";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import MobileNav from "@/components/MobileNav";
import HeaderSettingsMenu from "@/components/HeaderSettingsMenu";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import AiAssistant from "@/components/AiAssistant";
import Paywall from "@/components/Paywall";
import { useSubscription } from "@/lib/useSubscription";
import { useIsSuperAdmin } from "@/lib/superAdmins";
import { usePlatformSettings } from "@/lib/usePlatformSettings";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import HouseholdSuspended from "@/components/HouseholdSuspended";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

const NAV_SECTIONS = [
{
  title: "Général",
  items: [
  { to: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", short: "Transactions", icon: ArrowLeftRight },
  { to: "/calendrier", label: "Calendrier", short: "Calendrier", icon: CalendarDays }]

},
{
  title: "Analyse",
  items: [
  { to: "/rapports", label: "Rapports annuels", short: "Rapports", icon: BarChart3 },
  { to: "/analyse-mensuelle", label: "Analyse mensuelle", short: "Analyse", icon: LineChart },
  { to: "/repartition-depenses", label: "Répartition dépenses", short: "Répartition", icon: PieChart },
  { to: "/flux-tresorerie", label: "Flux de trésorerie", short: "Flux", icon: TrendingUp }]

},
{
  title: "Gestion",
  items: [
  { to: "/accounts", label: "Comptes", short: "Comptes", icon: Wallet },
  { to: "/budgets", label: "Budgets", short: "Budgets", icon: PiggyBank },
  { to: "/objectifs", label: "Objectifs épargne", short: "Objectifs", icon: Target },
  { to: "/dettes", label: "Dettes", short: "Dettes", icon: Landmark },
  { to: "/gestion-patrimoine", label: "Patrimoine", short: "Patrimoine", icon: Gem },
  { to: "/recurring", label: "Récurrences", short: "Récurrences", icon: Repeat },
  { to: "/categories", label: "Catégories", short: "Catégories", icon: Tags }]

},
{
  title: "Foyer & outils",
  items: [
  { to: "/gestion-membres", label: "Gestion des membres", short: "Membres", icon: Users },
  { to: "/notifications", label: "Notifications", short: "Notifs", icon: Bell },
  { to: "/parametres-notifications", label: "Préférences notifications", short: "Préférences", icon: SlidersHorizontal },
  { to: "/audit-log", label: "Journal d'activité", short: "Journal", icon: ScrollText },
  { to: "/profil", label: "Profil", short: "Profil", icon: User },
  { to: "/export-donnees", label: "Exporter données", short: "Exporter", icon: Download },
  { to: "/settings", label: "Réglages", short: "Réglages", icon: SettingsIcon },
  { to: "/abonnement", label: "Abonnement", short: "Abonnement", icon: CreditCard },
  { to: "/aide", label: "Aide & support", short: "Aide", icon: HelpCircle }]

}];

const MOBILE_NAV = [
{ to: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
{ to: "/transactions", label: "Transactions", short: "Transactions", icon: ArrowLeftRight },
{ to: "/calendrier", label: "Calendrier", short: "Calendrier", icon: CalendarDays },
{ to: "/accounts", label: "Comptes", short: "Comptes", icon: Wallet }];

export function useAppShell() {
  return useOutletContext();
}

export default function Layout() {
  const { user } = useAuth();
  const { household } = useHousehold(user);
  const { data: accounts = [] } = useAccounts(user);
  const { openQuickAdd } = useUI();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuper = useIsSuperAdmin(user);
  const { isExpired, daysLeft } = useSubscription(user);
  const { settings } = usePlatformSettings();
  // Langue de l'interface (sélecteur de l'en-tête) et diffusion globale du Super Admin
  const { t, lang, setLang } = useI18n();
  // Multi-devises : devise d'affichage personnelle + taux de change temps réel
  const { displayCurrency, setDisplayCurrency } = useCurrencyEnv(user, household);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(null);
  useEffect(() => {
    try {
      setDismissedAnnouncement(localStorage.getItem("kolo_dismissed_announcement"));
    } catch {}
  }, []);
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => db.entities.Announcement.list("-created_date", 1),
    refetchInterval: 300000,
  });
  const announcement =
    announcements[0] && announcements[0].id !== dismissedAnnouncement ? announcements[0] : null;
  const dismissAnnouncement = () => {
    if (!announcements[0]) return;
    try {
      localStorage.setItem("kolo_dismissed_announcement", announcements[0].id);
    } catch {}
    setDismissedAnnouncement(announcements[0].id);
  };
  // Feature flags distants : les rapports avancés peuvent être désactivés par le Super Admin
  const navSections =
    settings && settings.flag_rapports_avances === false
      ? NAV_SECTIONS.filter((s) => s.title !== "Analyse")
      : NAV_SECTIONS;
  const sections = isSuper
    ? [
        ...navSections,
        {
          title: "Administration",
          items: [{ to: "/super-admin", label: "Super Admin", short: "Admin", icon: ShieldCheck }],
        },
      ]
    : navSections;

  const [period, setPeriod] = useState(monthKey());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hotkey T pour ajout rapide
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        openQuickAdd();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openQuickAdd]);

  const currency = household?.currency || accounts[0]?.currency || "EUR";
  // Patrimoine converti dans la devise d'affichage choisie par l'utilisateur
  const netWorth = accounts.reduce(
    (s, a) => s + convertAmount(Number(a.balance || 0), a.currency || currency, displayCurrency),
    0
  );
  const initials = (user?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  const shiftPeriod = (delta) => {
    const [y, m] = period.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setPeriod(monthKey(d));
  };

  const shellContext = { period, setPeriod, household, currency };

  // Fin de l'essai gratuit : un plan est requis pour continuer (les super admins ne sont jamais bloqués)
  if (isExpired && !isSuper) return <Paywall />;

  // Mode maintenance global et foyers suspendus : contrôlés par le Super Admin
  if (settings?.maintenance_mode && !isSuper) return <MaintenanceScreen />;
  if (household?.suspended && !isSuper) return <HouseholdSuspended />;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <Image src={LOGO_URL} alt="Kolo" className="h-10 w-10 rounded-xl object-cover" />
          <span className="font-heading font-semibold tracking-tight">Kolo</span>
        </div>

        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-secondary cursor-default">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Foyer")}</div>
              <div className="truncate text-sm font-medium">{household?.name || "—"}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {sections.map((section) =>
          <div key={section.title}>
              <div className="px-2.5 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t(section.title)}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active ?
                    "bg-secondary text-foreground font-medium" :
                    "text-muted-foreground hover:bg-secondary hover:text-foreground"}`
                    }>
                    
                      <item.icon className="h-4 w-4" />
                      {t(item.label)}
                    </Link>);

              })}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              {user?.data?.avatar_url && <AvatarImage src={user.data.avatar_url} alt="Avatar" />}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {user?.data?.display_name || user?.full_name || "Membre"}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Top bar — pilule flottante */}
      <div className="sticky top-0 z-30 bg-background/70 px-3 pt-3 backdrop-blur md:pl-[15.75rem] md:pr-4">
        <header className="flex h-14 items-center gap-2 rounded-full border border-border bg-surface px-2.5 shadow-sm sm:gap-3 sm:px-4">
          <div className="md:hidden flex items-center gap-2">
            <MobileNav sections={sections} household={household} user={user} />
            <Image src={LOGO_URL} alt="Kolo" className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-heading font-semibold tracking-tight">{household?.name || "Kolo"}</span>
          </div>

          {/* Sélecteur de période */}
          <div className="hidden sm:flex items-center gap-1 rounded-full bg-secondary/70 py-1 pl-1.5 pr-2.5">
            <button
              onClick={() => shiftPeriod(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-background"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium capitalize w-32 text-center">{monthLabel(period)}</span>
            <button
              onClick={() => shiftPeriod(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-background"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {period !== monthKey() && (
            <button
              onClick={() => setPeriod(monthKey())}
              className="hidden sm:inline-flex h-7 items-center rounded-full bg-secondary/70 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("Ce mois")}
            </button>
          )}

          <div className="flex-1" />

          {/* Patrimoine — centré dans la pilule, converti dans la devise d'affichage */}
          <div className="hidden lg:flex h-9 shrink-0 items-center gap-2.5 rounded-full bg-secondary/70 px-3.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t("Patrimoine")}</span>
            <span className="font-mono-nums text-sm font-semibold">{formatCurrency(netWorth, displayCurrency)}</span>
          </div>

          <div className="flex-1" />

          {!isSuper && !isExpired && daysLeft != null && daysLeft <= 7 && (
            <Link
              to="/abonnement"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-full border border-warning/40 bg-warning-soft px-3 text-xs font-medium text-warning"
            >
              Essai : {daysLeft} j
            </Link>
          )}

          {mounted &&
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-gray-900 hover:bg-secondary dark:text-gray-100"
            aria-label="Thème"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          }

          <Button
            onClick={openQuickAdd}
            className="hidden sm:inline-flex h-9 bg-primary text-primary-foreground hover:bg-primary/90 [font-family:'Poppins',_ui-sans-serif,_system-ui,_sans-serif]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("Transaction")}
          </Button>

          {/* Devise d'affichage des états (multi-devises) */}
          <div className="relative hidden md:block">
            <Wallet className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              aria-label="Devise d'affichage"
              title="Devise d'affichage de vos états"
              className="h-9 rounded-full border border-border bg-surface pl-8 pr-2 text-xs font-medium"
            >
              {CURRENCY_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.codes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Sélecteur de langue — extrême droite, avant la déconnexion */}
          <div className="relative hidden md:block">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Langue"
              className="h-9 rounded-full border border-border bg-surface pl-8 pr-2 text-xs font-medium"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* Déconnexion — à l'extrême droite */}
          <button
            onClick={() => db.auth.logout("/login")}
            aria-label={t("Se déconnecter")}
            title={t("Se déconnecter")}
            className="hidden md:flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-gray-900 transition-colors hover:bg-secondary dark:text-gray-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t("Se déconnecter")}</span>
          </button>

          {/* Mobile : thème, langue, devise et déconnexion regroupés en un menu */}
          <div className="md:hidden">
            <HeaderSettingsMenu
              theme={theme}
              onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
              lang={lang}
              setLang={setLang}
              displayCurrency={displayCurrency}
              setDisplayCurrency={setDisplayCurrency}
              onLogout={() => db.auth.logout("/login")}
              t={t}
            />
          </div>
        </header>
      </div>

      {/* Bandeau de diffusion globale (publié depuis le Super Admin) */}
      {announcement && (
        <div className="border-b border-primary/30 bg-accent px-4 py-2.5 md:pl-[16rem]">
          <div className="flex items-center gap-3">
            <Megaphone className="h-4 w-4 shrink-0 text-accent-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-semibold text-accent-foreground">{announcement.title}</span>
              <span className="ml-2 text-accent-foreground/80">{announcement.message}</span>
            </div>
            <button
              onClick={dismissAnnouncement}
              aria-label="Fermer"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-accent-foreground/70 hover:bg-accent-foreground/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pl-[16rem] pb-24 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-6">
          <Outlet context={shellContext} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-border bg-surface h-16 px-2">
        {MOBILE_NAV.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] ${
              active ? "text-primary" : "text-muted-foreground"}`
              }>
              
              <item.icon className="h-5 w-5" />
              {t(item.short)}
            </Link>);

        })}
      </nav>

      {/* Mobile FAB */}
      <button
        onClick={openQuickAdd}
        className="sm:hidden fixed right-4 bottom-32 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        aria-label="Nouvelle transaction">
        
        <Plus className="h-6 w-6" />
      </button>

      {(!settings || settings.flag_ai_assistant !== false) && <AiAssistant />}
      <QuickAddTransaction />
    </div>);

}