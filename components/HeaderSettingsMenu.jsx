import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Sun, Moon, Globe, LogOut, Wallet, Check } from "lucide-react";
import { CURRENCY_GROUPS } from "@/lib/currencies";

/**
 * Menu regroupé de l'en-tête mobile : thème, langue, devise et déconnexion
 * dans un seul dropdown pour alléger la barre supérieure.
 */
export default function HeaderSettingsMenu({
  theme,
  onToggleTheme,
  lang,
  setLang,
  displayCurrency,
  setDisplayCurrency,
  onLogout,
  t,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-gray-900 transition-colors hover:bg-secondary dark:text-gray-100"
          aria-label="Réglages"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-3xl border-border p-2">
        {/* Thème */}
        <DropdownMenuItem
          onClick={onToggleTheme}
          className="gap-2.5 rounded-2xl px-3 py-2.5 text-sm"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? t("Thème clair") : t("Thème sombre")}
        </DropdownMenuItem>

        {/* Langue */}
        <div className="px-2 pb-1.5 pt-2">
          <div className="flex items-center gap-2 px-1 pb-1.5 text-xs font-medium text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {t("Langue")}
          </div>
          <div className="flex gap-1.5 rounded-full bg-secondary/70 p-1">
            {[{ code: "fr", label: "Français" }, { code: "en", label: "English" }].map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
                  lang === l.code
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === l.code && <Check className="h-3 w-3" />}
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Devise d'affichage */}
        <div className="px-2 pb-1.5 pt-1">
          <div className="flex items-center gap-2 px-1 pb-1.5 text-xs font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            {t("Devise")}
          </div>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="h-9 w-full rounded-full border border-input bg-surface px-3 text-sm"
            aria-label="Devise d'affichage"
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

        <DropdownMenuSeparator className="my-1.5" />

        {/* Déconnexion */}
        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2.5 rounded-2xl px-3 py-2.5 text-sm text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("Se déconnecter")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}