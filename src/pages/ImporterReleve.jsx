import React, { useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAccounts, useCategories, useTransactions } from "@/lib/useFinanceData";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/client";
import { parseBankStatementCsv, guessCategory } from "@/lib/bankImport";
import { formatCurrency } from "@/lib/format";
import { useAppShell } from "@/components/Layout";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileUp, Check, X, Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function ImporterReleve() {
  const { user } = useAuth();
  const { currency } = useAppShell();
  const { data: accounts = [] } = useAccounts(user);
  const { data: categories = [] } = useCategories(user);
  const { data: transactions = [] } = useTransactions(user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState(null); // null = pas encore de fichier chargé
  const [fileName, setFileName] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const categorized = rows ? rows.filter((r) => r.category_id).length : 0;

  const handleFile = async (file) => {
    setError("");
    setFileName(file.name);
    const text = await file.text();
    const result = parseBankStatementCsv(text);
    if (result.error) {
      setError(result.error);
      setRows(null);
      return;
    }
    if (result.rows.length === 0) {
      setError("Aucune transaction détectée dans ce fichier.");
      setRows(null);
      return;
    }
    const withCategory = result.rows.map((r, i) => ({
      ...r,
      id: i,
      selected: true,
      category_id: guessCategory(r.notes, r.type, categories, transactions),
    }));
    setRows(withCategory);
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const reset = () => {
    setRows(null);
    setFileName("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    const toImport = rows.filter((r) => r.selected);
    if (!accountId) {
      toast({ title: "Choisissez un compte de destination", variant: "destructive" });
      return;
    }
    if (toImport.length === 0) {
      toast({ title: "Aucune ligne sélectionnée", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      await db.entities.Transaction.bulkCreate(
        toImport.map((r) => ({
          account_id: accountId,
          category_id: r.category_id || null,
          amount: r.amount,
          type: r.type,
          date: r.date,
          notes: r.notes,
        }))
      );
      const delta = toImport.reduce((sum, r) => sum + (r.type === "income" ? Number(r.amount) : -Number(r.amount)), 0);
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        await db.entities.Account.update(accountId, {
          balance: Number((Number(account.balance || 0) + delta).toFixed(2)),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: `${toImport.length} transaction(s) importée(s)` });
      reset();
    } catch (err) {
      toast({ title: "Échec de l'import", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (!rows) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <FileUp className="h-5 w-5" /> Importer un relevé bancaire
          </h1>
          <p className="text-sm text-muted-foreground">
            Déposez un export CSV de votre banque — Kolo détecte les colonnes et propose une
            catégorie pour chaque transaction, à partir de vos habitudes et des marchands connus.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface p-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Cliquez pour choisir un fichier CSV</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Export depuis votre espace bancaire en ligne — formats les plus courants pris en charge
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </label>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <FileUp className="h-5 w-5" /> Vérifier l'import — {fileName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} transaction(s) détectée(s), {categorized} déjà catégorisée(s)
            automatiquement. Ajustez si besoin avant de valider.
          </p>
        </div>
        <Button variant="outline" onClick={reset} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Changer de fichier
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <label className="text-sm font-medium">Compte de destination</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">Choisir un compte…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-8 p-2"></th>
              <th className="p-2">Date</th>
              <th className="p-2">Libellé</th>
              <th className="p-2 text-right">Montant</th>
              <th className="p-2">Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-border ${!r.selected ? "opacity-40" : ""}`}>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={r.selected}
                    onChange={(e) => updateRow(r.id, { selected: e.target.checked })}
                  />
                </td>
                <td className="whitespace-nowrap p-2 font-mono-nums">{r.date}</td>
                <td className="max-w-xs truncate p-2" title={r.notes}>
                  {r.notes || <span className="text-muted-foreground">—</span>}
                </td>
                <td
                  className={`whitespace-nowrap p-2 text-right font-mono-nums font-medium ${
                    r.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {r.type === "income" ? "+" : "−"}
                  {formatCurrency(r.amount, currency)}
                </td>
                <td className="p-2">
                  <select
                    value={r.category_id || ""}
                    onChange={(e) => updateRow(r.id, { category_id: e.target.value || null })}
                    className="h-8 w-full max-w-[160px] rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="">Sans catégorie</option>
                    {categories
                      .filter((c) => c.type === r.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {r.category_id && (
                    <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Sparkles className="h-2.5 w-2.5" /> auto
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={reset}>
          <X className="mr-1.5 h-4 w-4" /> Annuler
        </Button>
        <Button onClick={confirmImport} disabled={importing} className="gap-1.5">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Importer {rows.filter((r) => r.selected).length} transaction(s)
        </Button>
      </div>
    </div>
  );
}
