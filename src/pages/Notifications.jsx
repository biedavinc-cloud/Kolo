import { db } from "@/api/client";
import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/useNotifications";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import { Bell, PiggyBank, Repeat, Hourglass, CheckCheck, Gauge } from "lucide-react";

const ICONS = {
  budget_exceeded: PiggyBank,
  budget_warning: Gauge,
  recurring_due: Repeat,
  trial_ending: Hourglass,
};

const SEVERITY_BORDER = {
  info: "border-l-primary",
  warning: "border-l-warning",
  danger: "border-l-expense",
};

// Historique des notifications du foyer : dépassements de budget, rappels
// de transactions récurrentes et alertes d'abonnement.
export default function Notifications() {
  const { user } = useAuth();
  const { notifications, refetch } = useNotifications(user);
  const { toast } = useToast();

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.read);
    if (unreadItems.length === 0) return;
    await db.entities.Notification.bulkUpdate(
      unreadItems.map((n) => ({ id: n.id, read: true }))
    );
    await refetch();
    toast({ title: "Notifications marquées comme lues" });
  };

  const markRead = async (n) => {
    if (n.read) return;
    await db.entities.Notification.update(n.id, { read: true });
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Bell className="h-5 w-5" /> Notifications
            {unread > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Alertes de dépassement de budget, rappels d'échéances récurrentes et informations d'abonnement.
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="rounded-full"
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className={`flex w-full items-start gap-3 rounded-xl border border-border border-l-4 bg-surface px-4 py-3 text-left transition-colors hover:bg-secondary/40 ${
                SEVERITY_BORDER[n.severity] || "border-l-border"
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(n.created_date).toLocaleString("fr-FR")}
                </p>
              </div>
            </button>
          );
        })}

        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Aucune notification</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous serez alerté ici en cas de dépassement de budget ou d'échéance à venir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}