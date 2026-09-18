import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Loader2 } from "lucide-react";

// Diffusions globales : publier une notification visible par tous les utilisateurs
export default function BroadcastSection({ announcements, onBroadcast, busy }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    const ok = await onBroadcast({ title: title.trim(), message: message.trim() });
    if (ok) {
      setTitle("");
      setMessage("");
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="h-4 w-4" /> Nouvelle diffusion globale
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="bc-title">Titre</Label>
          <Input
            id="bc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Maintenance prévue dimanche"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-message">Message</Label>
          <textarea
            id="bc-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Le message affiché en bandeau à tous les utilisateurs de la plateforme."
            required
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Publier la diffusion
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Diffusions récentes</h3>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune diffusion publiée.</p>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created_date).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                {a.created_by && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Par {a.created_by}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}