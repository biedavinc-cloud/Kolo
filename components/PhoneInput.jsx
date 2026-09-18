import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHONE_COUNTRIES, detectDialCode } from "@/lib/phoneCountries";

// Champ téléphone international : sélecteur d'indicatif pays + numéro
export default function PhoneInput({ id, value, onChange, required, placeholder }) {
  const country = value?.country || detectDialCode();
  const number = value?.number || "";

  return (
    <div className="flex gap-2">
      <Select value={country} onValueChange={(v) => onChange({ country: v, number })}>
        <SelectTrigger className="h-12 w-[6.5rem] shrink-0" aria-label="Indicatif pays">
          <SelectValue>{country}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {PHONE_COUNTRIES.map((c) => (
            <SelectItem key={c.iso + c.dial + c.name} value={c.dial}>
              {c.name} ({c.dial})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className="h-12 flex-1"
        placeholder={placeholder || "6 12 34 56 78"}
        value={number}
        onChange={(e) => onChange({ country, number: e.target.value.replace(/[^\d\s]/g, "") })}
        required={required}
      />
    </div>
  );
}