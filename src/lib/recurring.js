// Occurrences des transactions récurrentes pour un mois donné (clé "YYYY-MM")

function pad(n) {
  return String(n).padStart(2, "0");
}

// Retourne [{ r, date }] — toutes les échéances tombant dans le mois indiqué
export function recurringInMonth(recurring = [], ym) {
  const out = [];
  if (!ym) return out;
  const [y, m] = ym.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);

  for (const r of recurring) {
    if (!r.next_date) continue;
    const next = new Date(r.next_date);
    if (isNaN(next)) continue;
    const nextKey = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;

    if (r.frequency === "weekly") {
      let d = new Date(next);
      while (d <= monthEnd) {
        if (d >= monthStart) out.push({ r, date: new Date(d) });
        d = new Date(d);
        d.setDate(d.getDate() + 7);
      }
    } else if (r.frequency === "yearly") {
      if (m - 1 === next.getMonth() && ym >= nextKey) {
        out.push({ r, date: new Date(y, m - 1, next.getDate()) });
      }
    } else {
      // monthly (et par défaut)
      if (ym >= nextKey) {
        const day = Math.min(next.getDate(), monthEnd.getDate());
        out.push({ r, date: new Date(y, m - 1, day) });
      }
    }
  }
  return out;
}