import { db } from "@/api/client";
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useAccounts, useTransactions, useCategories, useBudgets } from "@/lib/useFinanceData";
import { useSubscription } from "@/lib/useSubscription";
import { getPlanLimits } from "@/lib/plans";

import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import { X, Send, Loader2, Lock } from "lucide-react";

const SUGGESTIONS = [
  "Comment puis-je réduire mes dépenses ce mois-ci ?",
  "Analyse mon budget et donne-moi des conseils",
  "Comment épargner plus vite pour mes objectifs ?",
];

// Assistant IA Kolo — propulsé par Gemini (clé secrète GEMINI_API_KEY)
export default function AiAssistant() {
  const { user } = useAuth();
  const { plan } = useSubscription(user);
  const limits = getPlanLimits(plan);
  const { data: accounts = [] } = useAccounts(user);
  const { data: transactions = [] } = useTransactions(user);
  const { data: categories = [] } = useCategories(user);
  const { data: budgets = [] } = useBudgets(user);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const period = monthKey();

  // Résumé financier du foyer transmis à l'IA (montants arrondis)
  const context = useMemo(() => {
    const monthTx = transactions.filter((t) => (t.date || "").slice(0, 7) === period);
    const expenses = monthTx.filter((t) => t.type === "expense");
    const totalExp = expenses.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalInc = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const byCat = categories
      .map((c) => ({
        name: c.name,
        total: expenses
          .filter((t) => t.category_id === c.id)
          .reduce((s, t) => s + Number(t.amount || 0), 0),
      }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((x) => `${x.name}: ${Math.round(x.total)}`)
      .join(", ");
    const bud = budgets
      .filter((b) => b.month_year === period)
      .map((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const spent = expenses
          .filter((t) => t.category_id === b.category_id)
          .reduce((s, t) => s + Number(t.amount || 0), 0);
        return `${cat?.name || "?"}: ${Math.round(spent)}/${Math.round(b.amount_limit)}`;
      })
      .join(", ");
    const accs = accounts
      .map((a) => `${a.name} (${a.currency}): ${Math.round(Number(a.balance || 0))}`)
      .join(", ");
    return `Mois analysé : ${monthLabel(period)}. Revenus du mois : ${Math.round(
      totalInc
    )}. Dépenses du mois : ${Math.round(totalExp)}. Top catégories de dépenses : ${
      byCat || "aucune"
    }. Budgets (dépensé/plafond) : ${bud || "aucun"}. Comptes : ${accs || "aucun"}.`;
  }, [transactions, categories, budgets, accounts, period]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: message }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await db.functions.invoke("koloAssistant", {
        message,
        context,
        history: next.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.data?.reply || "Je n'ai pas pu générer de réponse." },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Désolé, une erreur est survenue : " +
            (err.response?.data?.error || err.message),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-[4.5rem] md:bottom-6 z-40 flex h-11 items-center gap-2 rounded-full border border-border bg-card/95 px-4 shadow-lg backdrop-blur transition-all hover:border-primary/40 hover:shadow-xl active:scale-95"
        aria-label="Assistant Kolo"
      >
        <Image src={LOGO_URL} alt="Kolo" className="h-6 w-6 rounded-md object-cover" />
        <span className="text-sm font-medium tracking-tight">Assistant Kolo</span>
      </button>

      {open && (
        <div className="fixed right-4 bottom-[8rem] md:bottom-24 z-50 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Image src={LOGO_URL} alt="Kolo" className="h-5 w-5 rounded object-cover" /> Assistant Kolo
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!limits.ai ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Assistant IA réservé aux plans Pro et supérieurs</p>
              <Link to="/abonnement" className="text-sm text-primary hover:underline">
                Voir les abonnements
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Posez vos questions financières — Kolo AI connaît le budget de votre foyer (
                      {monthLabel(period)}).
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full rounded-full border border-border px-3 py-2 text-left text-xs hover:bg-secondary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user"
                        ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                        : "mr-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2 text-sm"
                    }
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div className="mr-auto w-fit rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Votre question…"
                  className="flex h-9 flex-1 rounded-full border border-input bg-surface px-4 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}