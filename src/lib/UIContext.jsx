import React, { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const openQuickAdd = useCallback(() => {
    setEditingTx(null);
    setQuickAddOpen(true);
  }, []);

  const openEditTx = useCallback((tx) => {
    setEditingTx(tx);
    setQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setQuickAddOpen(false);
    setEditingTx(null);
  }, []);

  return (
    <UIContext.Provider
      value={{ quickAddOpen, editingTx, openQuickAdd, openEditTx, closeQuickAdd }}
    >
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};