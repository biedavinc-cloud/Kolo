// Helpers de formatage monétaire et de dates pour Liyah
import { CURRENCY_SYMBOLS as currencySymbols } from "@/lib/currencies";

// Contexte multi-devises : devise d'affichage de l'utilisateur + taux de change
// (base USD : nombre d'unités par dollar). Renseigné par useCurrencyEnv dans le
// Layout — tant que les taux sont absents, aucun montant n'est converti.
let FX = { displayCurrency: null, rates: null };

export function setCurrencyContext({ displayCurrency, rates }) {
  FX = { displayCurrency: displayCurrency || null, rates: rates || null };
}

export function getCurrencyContext() {
  return FX;
}

// Convertit un montant entre deux devises via les taux chargés (base USD)
export function convertAmount(amount, from = "EUR", to = "EUR") {
  const value = Number(amount || 0);
  if (!FX.rates || from === to) return value;
  const fromRate = FX.rates[from];
  const toRate = FX.rates[to];
  if (!fromRate || !toRate) return value;
  return (value / fromRate) * toRate;
}

function resolveDisplay(amount, currency) {
  // Devise d'affichage choisie : tout montant est converti vers cette devise
  if (
    FX.displayCurrency &&
    FX.rates &&
    currency !== FX.displayCurrency &&
    FX.rates[currency] &&
    FX.rates[FX.displayCurrency]
  ) {
    return { value: convertAmount(amount, currency, FX.displayCurrency), currency: FX.displayCurrency };
  }
  return { value: Number(amount || 0), currency };
}

export function formatCurrency(amount, currency = "EUR") {
  const { value, currency: cur } = resolveDisplay(amount, currency);
  const symbol = currencySymbols[cur] || cur || "€";
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted}\u00A0${symbol}`;
}

export function formatCompact(amount, currency = "EUR") {
  const { value, currency: cur } = resolveDisplay(amount, currency);
  const symbol = currencySymbols[cur] || cur || "€";
  const abs = Math.abs(value);
  let str;
  if (abs >= 1000) str = (value / 1000).toFixed(1).replace(".0", "") + "k";
  else str = value.toFixed(0);
  return `${str}\u00A0${symbol}`;
}

export function formatSigned(amount, currency = "EUR") {
  const { value, currency: cur } = resolveDisplay(amount, currency);
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatCurrency(Math.abs(value), cur)}`;
}

export function monthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function shortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isSameMonth(dateStr, key) {
  if (!dateStr) return false;
  return dateStr.slice(0, 7) === key;
}