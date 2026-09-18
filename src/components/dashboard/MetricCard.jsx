import React from "react";
import { cn } from "@/lib/utils";

// Carte métrique style Shopify : bordure 1px, sans ombre, label micro uppercase.
export default function MetricCard({ label, value, sub, tone = "default", icon: Icon, children }) {
  const toneClasses = {
    default: "",
    income: "text-income",
    expense: "text-expense",
    warning: "text-warning"
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground [font-family:'Poppins',_ui-sans-serif,_system-ui,_sans-serif]">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={cn("mt-2 font-mono-nums text-2xl font-semibold tracking-tight text-[hsl(var(--warning))]", toneClasses[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      {children}
    </div>);

}