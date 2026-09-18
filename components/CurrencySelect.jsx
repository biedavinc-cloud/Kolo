import React from "react";
import { CURRENCIES, CURRENCY_GROUPS } from "@/lib/currencies";
import { cn } from "@/lib/utils";

// Sélecteur de devise regroupé par zone (internationales + toutes les devises africaines)
export default function CurrencySelect({ id, value, onChange, className }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-10 w-full rounded-md border border-input bg-surface px-3 text-sm", className)}
    >
      {CURRENCY_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.codes.map((code) => {
            const c = CURRENCIES[code];
            return (
              <option key={code} value={code}>
                {`${c.label} (${c.symbol}) — ${code}`}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}