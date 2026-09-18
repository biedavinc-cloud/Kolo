import { db } from "@/api/client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getHouseholdId } from "@/lib/useHousehold";
import { useTransactions, useBudgets, useRecurring, useCategories } from "@/lib/useFinanceData";
import { useSubscription } from "@/lib/useSubscription";
import { monthKey } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Centre de notifications : les alertes (dépassements de budget, échéances
// récurrentes, fin d'essai) sont calculées depuis les données du foyer puis
// persistées une seule fois grâce à une clé d'unicité — l'historique reste
// consultable dans le temps.
export function useNotifications(user) {
  const hid = getHouseholdId(user);
  const qc = useQueryClient();
  // Préférences utilisateur (/parametres-notifications) : seuil d'alerte et types activés
  const threshold = Math.min(100, Math.max(50, Number(user?.data?.notif_threshold ?? 80)));
  const typeEnabled = (t) => !user?.data?.notif_types || user.data.notif_types[t] !== false;
  const { data: transactions = [] } = useTransactions(user);
  const { data: budgets = [] } = useBudgets(user);
  const { data: recurring = [] } = useRecurring(user);
  const { data: categories = [] } = useCategories(user);
  const { subscription } = useSubscription(user);

  useEffect(() => {
    if (!hid) return;
    const alerts = [];
    const mk = monthKey();
    const today = todayISO();
    const soon = addDays(today, 7);
    const catName = (id) => categories.find((c) => c.id === id)?.name || "Catégorie";

    // Dépassements de budget du mois en cours
    budgets
      .filter((b) => b.month_year === mk)
      .forEach((b) => {
        const spent = transactions
          .filter(
            (t) => t.type === "expense" && t.category_id === b.category_id && (t.date || "").startsWith(mk)
          )
          .reduce((s, t) => s + Number(t.amount || 0), 0);
        const limit = Number(b.amount_limit || 0);
        if (spent > limit && typeEnabled("budget_exceeded")) {
          alerts.push({
            type: "budget_exceeded",
            severity: spent > limit * 1.1 ? "danger" : "warning",
            title: `Budget dépassé : ${catName(b.category_id)}`,
            message: `${Math.round(spent)} dépensés sur un plafond de ${limit} pour ${mk}.`,
            dedupe_key: `${hid}-budget-${b.category_id}-${mk}`,
          });
        } else if (typeEnabled("budget_warning") && spent >= limit * (threshold / 100)) {
          // Alerte préventive dès le seuil choisi du budget mensuel consommé
          alerts.push({
            type: "budget_warning",
            severity: "info",
            title: `${threshold} % du budget atteint : ${catName(b.category_id)}`,
            message: `${Math.round(spent)} dépensés sur un plafond de ${limit} pour ${mk}. Il reste ${Math.round(limit - spent)} avant dépassement.`,
            dedupe_key: `${hid}-budget-warn-${b.category_id}-${mk}`,
          });
        }
      });

    // Échéances récurrentes : à venir (7 jours) ou en retard
    if (typeEnabled("recurring_due")) recurring.forEach((r) => {
      if (!r.next_date) return;
      if (r.next_date < today) {
        alerts.push({
          type: "recurring_due",
          severity: "danger",
          title: `Échéance en retard : ${r.notes || "Transaction récurrente"}`,
          message: `L'échéance du ${r.next_date} n'a pas encore été enregistrée.`,
          dedupe_key: `${hid}-recurring-${r.id}-${r.next_date}`,
        });
      } else if (r.next_date <= soon) {
        alerts.push({
          type: "recurring_due",
          severity: "info",
          title: `Échéance à venir : ${r.notes || "Transaction récurrente"}`,
          message: `Paiement de ${r.amount} prévu le ${r.next_date}.`,
          dedupe_key: `${hid}-recurring-${r.id}-${r.next_date}`,
        });
      }
    });

    // Fin d'essai gratuit imminente
    if (typeEnabled("trial_ending") && subscription?.status === "trial" && subscription.trial_end && subscription.trial_end <= addDays(today, 5)) {
      alerts.push({
        type: "trial_ending",
        severity: "warning",
        title: "Essai gratuit bientôt terminé",
        message: `Votre essai se termine le ${subscription.trial_end}. Choisissez un plan pour continuer à utiliser Kolo.`,
        dedupe_key: `${hid}-trial-${subscription.trial_end}`,
      });
    }

    if (alerts.length === 0) return;

    (async () => {
      try {
        const existing = await db.entities.Notification.list();
        const seen = new Set(existing.map((n) => n.dedupe_key));
        const fresh = alerts.filter((a) => !seen.has(a.dedupe_key));
        if (fresh.length > 0) {
          await db.entities.Notification.bulkCreate(
            fresh.map((a) => ({ household_id: hid, ...a }))
          );
          qc.invalidateQueries({ queryKey: ["notifications", hid] });
        }
      } catch (e) {
        console.error("notifications:", e.message);
      }
    })();
  }, [hid, transactions, budgets, recurring, categories, subscription, qc, user]);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications", hid],
    queryFn: () => db.entities.Notification.list("-created_date", 100),
    enabled: !!hid,
  });

  return { notifications, refetch };
}