const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getHouseholdId } from "@/lib/useHousehold";

export const qk = {
  accounts: (hid) => ["accounts", hid],
  categories: (hid) => ["categories", hid],
  transactions: (hid) => ["transactions", hid],
  budgets: (hid) => ["budgets", hid],
  recurring: (hid) => ["recurring", hid],
  goals: (hid) => ["goals", hid],
  debts: (hid) => ["debts", hid],
};

export function useAccounts(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.accounts(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.Account.list();
      return items.filter((a) => a.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useCategories(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.categories(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.Category.list();
      return items.filter((c) => c.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useTransactions(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.transactions(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.Transaction.list("-date", 500);
      return items.filter((t) => t.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useBudgets(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.budgets(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.Budget.list();
      return items.filter((b) => b.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useRecurring(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.recurring(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.RecurringTransaction.list();
      return items.filter((r) => r.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useGoals(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.goals(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.SavingsGoal.list();
      return items.filter((g) => g.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useDebts(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: qk.debts(hid),
    queryFn: async () => {
      if (!hid) return [];
      const items = await db.entities.Debt.list();
      return items.filter((d) => d.household_id === hid);
    },
    enabled: !!hid,
  });
}

export function useMembers(user) {
  const hid = getHouseholdId(user);
  return useQuery({
    queryKey: ["members", hid],
    queryFn: async () => {
      if (!hid) return user ? [user] : [];
      try {
        const users = await db.entities.User.list();
        return users.filter(
          (u) => u.data?.household_id === hid || u.household_id === hid
        );
      } catch (e) {
        return user ? [user] : [];
      }
    },
    enabled: !!hid,
  });
}

export function useInvalidateAll(user) {
  const qc = useQueryClient();
  const hid = getHouseholdId(user);
  return () => {
    qc.invalidateQueries({ queryKey: qk.accounts(hid) });
    qc.invalidateQueries({ queryKey: qk.categories(hid) });
    qc.invalidateQueries({ queryKey: qk.transactions(hid) });
    qc.invalidateQueries({ queryKey: qk.budgets(hid) });
    qc.invalidateQueries({ queryKey: qk.recurring(hid) });
    qc.invalidateQueries({ queryKey: qk.goals(hid) });
    qc.invalidateQueries({ queryKey: qk.debts(hid) });
  };
}