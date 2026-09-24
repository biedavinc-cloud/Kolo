// Import de relevé bancaire (CSV) : détection des colonnes, parsing tolérant
// aux formats des différentes banques (délimiteur, format de date, montant
// signé ou colonnes débit/crédit séparées), puis catégorisation automatique.

function detectDelimiter(sampleLine) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of sampleLine) if (ch in counts) counts[ch]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Parseur CSV minimal gérant les champs entre guillemets (avec "" échappé)
function parseCsvLines(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      pushField();
    } else if (ch === "\n") {
      if (text[i - 1] !== "\r" || field !== "" || row.length > 0) pushRow();
    } else if (ch === "\r") {
      // ignoré, géré avec \n
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) pushRow();
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

const HEADER_ALIASES = {
  date: ["date", "date operation", "date d'opération", "transaction date", "posting date", "value date"],
  label: ["libelle", "libellé", "description", "label", "details", "détails", "memo", "narration", "wording"],
  amount: ["montant", "amount", "amount (eur)", "amount (usd)", "value", "montant (eur)"],
  debit: ["debit", "débit", "withdrawal", "money out", "dépense"],
  credit: ["credit", "crédit", "deposit", "money in", "recette"],
};

function normalizeHeader(h) {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchColumn(headers, aliases) {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h === normalizeHeader(alias));
    if (idx !== -1) return idx;
  }
  // correspondance partielle en repli
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h.includes(normalizeHeader(alias)));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  const negative = /^-|\(.*\)$/.test(s);
  s = s.replace(/[()€$£\s]/g, "").replace(/^-/, "");
  // Format européen "1.234,56" -> "1234.56" ; sinon on retire juste les
  // séparateurs de milliers en virgule.
  if (/,\d{1,2}$/.test(s) && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return negative ? -Math.abs(n) : n;
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // YYYY-MM-DD (déjà au bon format)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY ou MM/DD/YYYY ou DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    let [, a, b, year] = m;
    // Heuristique : si le premier nombre > 12, c'est forcément le jour (format DD/MM/YYYY)
    const day = Number(a) > 12 ? a : b;
    const month = Number(a) > 12 ? b : a;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/**
 * Analyse un fichier CSV de relevé bancaire.
 * Retourne { rows: [{date, amount, type, notes, raw}], columns, error }
 */
export function parseBankStatementCsv(text) {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || "";
  const delimiter = detectDelimiter(firstLine);
  const table = parseCsvLines(text, delimiter);
  if (table.length < 2) return { rows: [], error: "Fichier vide ou illisible." };

  const headers = table[0];
  const dateCol = matchColumn(headers, HEADER_ALIASES.date);
  const labelCol = matchColumn(headers, HEADER_ALIASES.label);
  const amountCol = matchColumn(headers, HEADER_ALIASES.amount);
  const debitCol = matchColumn(headers, HEADER_ALIASES.debit);
  const creditCol = matchColumn(headers, HEADER_ALIASES.credit);

  if (dateCol === -1) {
    return { rows: [], error: "Colonne de date introuvable. Vérifiez que le fichier contient bien une colonne 'Date'." };
  }
  if (amountCol === -1 && debitCol === -1 && creditCol === -1) {
    return { rows: [], error: "Colonne de montant introuvable (ni 'Montant', ni 'Débit'/'Crédit')." };
  }

  const rows = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    if (!r || r.every((c) => !c || !c.trim())) continue;
    const date = parseDate(r[dateCol]);
    let amount = null;
    let type = "expense";
    if (amountCol !== -1) {
      amount = parseAmount(r[amountCol]);
      if (amount != null) {
        type = amount >= 0 ? "income" : "expense";
        amount = Math.abs(amount);
      }
    } else {
      const debit = debitCol !== -1 ? parseAmount(r[debitCol]) : null;
      const credit = creditCol !== -1 ? parseAmount(r[creditCol]) : null;
      if (credit) {
        amount = Math.abs(credit);
        type = "income";
      } else if (debit) {
        amount = Math.abs(debit);
        type = "expense";
      }
    }
    if (!date || amount == null || amount === 0) continue;
    const notes = labelCol !== -1 ? (r[labelCol] || "").trim() : "";
    rows.push({ date, amount, type, notes });
  }

  return { rows, columns: { dateCol, labelCol, amountCol, debitCol, creditCol }, delimiter };
}

// Dictionnaire de mots-clés marchands -> nom de catégorie par défaut
// (voir defaultCategories.js). Appliqué sur la description en minuscules.
const MERCHANT_KEYWORDS = [
  [/uber|bolt|taxi|indriv/i, "Transport"],
  [/total|shell|essence|station.?service|fuel/i, "Carburant"],
  [/carrefour|auchan|leclerc|walmart|monoprix|supermarch|market/i, "Courses"],
  [/netflix|spotify|deezer|canal\+|disney|prime video/i, "Abonnements"],
  [/orange|mtn|airtel|free mobile|sfr|bouygues|moov/i, "Internet & téléphone"],
  [/edf|eneo|senelec|eau|electricit|sonabel/i, "Électricité & eau"],
  [/pharmacie|pharmacy/i, "Pharmacie"],
  [/hopital|hôpital|clinique|medecin|médecin|doctor/i, "Santé"],
  [/loyer|rent\b/i, "Loyer"],
  [/restaurant|mcdo|kfc|burger|pizza/i, "Restaurants"],
  [/salaire|salary|paie\b/i, "Salaire"],
  [/virement recu|virement reçu|transfer in/i, "Remboursements"],
  [/assurance|insurance/i, "Assurances"],
  [/ecole|école|school|universit/i, "Éducation"],
  [/gym|fitness|sport/i, "Sport"],
  [/air france|ethiopian|emirates|hotel|hôtel|booking\.com/i, "Voyages"],
];

/**
 * Devine une catégorie pour une ligne importée, en se basant :
 * 1. sur les catégories déjà utilisées pour des libellés similaires dans
 *    l'historique du foyer (le plus fiable — appris de vos propres habitudes)
 * 2. à défaut, sur un dictionnaire de mots-clés marchands courants
 * Retourne un category_id ou null (l'utilisateur choisit alors manuellement).
 */
export function guessCategory(notes, type, categories, pastTransactions) {
  const lower = (notes || "").toLowerCase();
  if (!lower) return null;

  // 1. Historique : cherche une transaction passée dont le libellé partage
  // un mot significatif (>=4 lettres) avec celui-ci.
  const words = lower.split(/[^a-z0-9àâäéèêëïîôöùûüç]+/i).filter((w) => w.length >= 4);
  if (words.length && pastTransactions?.length) {
    for (const w of words) {
      const match = pastTransactions.find(
        (t) => t.type === type && t.category_id && (t.notes || "").toLowerCase().includes(w)
      );
      if (match) return match.category_id;
    }
  }

  // 2. Dictionnaire de mots-clés
  for (const [pattern, categoryName] of MERCHANT_KEYWORDS) {
    if (pattern.test(lower)) {
      const cat = categories.find((c) => c.name === categoryName && c.type === type);
      if (cat) return cat.id;
    }
  }

  return null;
}
