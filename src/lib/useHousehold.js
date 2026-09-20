import { db } from "@/api/client";
import { useState, useEffect, useCallback } from "react";

import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

// Récupère le household_id du user (stocké via updateMe, lu par le RLS via user.data.household_id)
export function getHouseholdId(user) {
  if (!user) return null;
  return user.data?.household_id || user.household_id || null;
}

// Hook central : charge le foyer courant et les membres. Retourne aussi des helpers.
export function useHousehold(user) {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const householdId = getHouseholdId(user);

  const reload = useCallback(async () => {
    if (!householdId) {
      setHousehold(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const h = await db.entities.Household.get(householdId);
      setHousehold(h);
    } catch (e) {
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { household, householdId, loading, reload };
}

// Crée un foyer et rattache l'utilisateur courant
export async function createHousehold(name, currency) {
  const h = await db.entities.Household.create({ name, currency });
  await db.entities.Category.bulkCreate(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, household_id: h.id }))
  );
  return h;
}

// Rejoint un foyer existant via son code d'invitation
export async function joinHousehold(code) {
  return db.entities.Household.join(code.trim());
}