import { db } from "@/api/client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCategories, useInvalidateAll } from "@/lib/useFinanceData";
import { getHouseholdId } from "@/lib/useHousehold";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Loader2, RotateCcw } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

const ICONS = [
  "Tag", "Briefcase", "Laptop", "HandCoins", "GraduationCap", "Building", "Store", "Receipt", "TrendingUp",
  "ShoppingCart", "Utensils", "Coffee", "Home", "Lightbulb", "Wifi", "Sofa", "Wrench", "Car", "Fuel", "Plane",
  "Heart", "Pill", "Baby", "Gift", "HeartHandshake", "PawPrint", "Gamepad2", "Dumbbell", "Shirt", "Sparkles",
  "Repeat", "Shield", "Landmark", "CreditCard", "PiggyBank", "Banknote", "Sun", "Zap", "BookOpen", "Music",
];

const PALETTE = [
  "#108548", "#008060", "#0E7490", "#2563EB", "#4F46E5", "#7C3AED", "#C026D3",
  "#DB2777", "#E11D48", "#DC2626", "#EA580C", "#F59E0B", "#B54708", "#6D7175",
];

export default function CategoryManager() {
  const { user } = useAuth();
  const householdId = getHouseholdId(user);
  const { data: categories = [] } = useCategories(user);
  const invalidate = useInvalidateAll(user);
  const { toast } = useToast();

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState("#6D7175");
  const [icon, setIcon] = useState("Tag");
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEditing({});
    setName("");
    setType("expense");
    setColor("#6D7175");
    setIcon("Tag");
  };
  const startEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color || "#6D7175");
    setIcon(c.icon || "Tag");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await db.entities.Category.update(editing.id, { name: name.trim(), type, color, icon });
        toast({ title: "Catégorie mise à jour" });
      } else {
        await db.entities.Category.create({ household_id: householdId, name: name.trim(), type, color, icon });
        toast({ title: "Catégorie créée" });
      }
      invalidate();
      setEditing(null);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    await db.entities.Category.delete(c.id);
    invalidate();
    toast({ title: "Catégorie supprimée" });
  };

  // Ajoute les catégories par défaut manquantes (personnalisables ensuite)
  const restoreDefaults = async () => {
    const existing = new Set(categories.map((c) => (c.name || "").trim().toLowerCase()));
    const missing = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.name.toLowerCase()));
    if (missing.length === 0) {
      toast({ title: "Toutes les catégories par défaut sont déjà présentes" });
      return;
    }
    try {
      await db.entities.Category.bulkCreate(
        missing.map((c) => ({ ...c, household_id: householdId }))
      );
      invalidate();
      toast({ title: `${missing.length} catégories ajoutées` });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Catégories</h3>
        <div className="flex gap-1.5">
          <Button onClick={restoreDefaults} variant="outline" size="sm" className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Défauts
          </Button>
          <Button onClick={startCreate} variant="outline" size="sm" className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      {editing !== null && (
        <form onSubmit={save} className="mb-4 rounded-md border border-border p-3 space-y-3 bg-background">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-full border border-input bg-surface px-3 text-sm">
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Couleur</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      color === c ? "border-2 border-foreground scale-110" : "border border-border"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-9 rounded-md border border-input bg-surface"
                  title="Couleur personnalisée"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Icône</Label>
            <select value={icon} onChange={(e) => setIcon(e.target.value)} className="h-10 rounded-full border border-input bg-surface px-3 text-sm">
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing.id ? "Enregistrer" : "Créer"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map((c) => (
          <div key={c.id} className="group flex items-center gap-2.5 rounded-md border border-border px-3 py-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || "#6D7175" }} />
            <span className="text-sm flex-1 truncate">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.type === "income" ? "Revenu" : "Dépense"}</span>
            <button onClick={() => startEdit(c)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => remove(c)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-expense-soft text-muted-foreground hover:text-expense opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {categories.length === 0 && editing === null && (
          <p className="text-sm text-muted-foreground col-span-2">Aucune catégorie. Créez-en pour classer vos transactions.</p>
        )}
      </div>
    </div>
  );
}