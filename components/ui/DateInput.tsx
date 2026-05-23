"use client";

import { useState, useEffect } from "react";

interface DateInputProps {
  value: string;           // YYYY-MM-DD
  onChange: (v: string) => void; // emits YYYY-MM-DD (or "" when incomplete)
  className?: string;
  required?: boolean;
  error?: boolean;
  min?: string;            // YYYY-MM-DD — used only for aria/title hints
  max?: string;
}

/** Strip non-digits and reformat as DD/MM/YYYY */
function digitsToDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  return out;
}

/** YYYY-MM-DD → DD/MM/YYYY */
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** DD/MM/YYYY → YYYY-MM-DD (returns "" if incomplete) */
function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const [dd, mm, yyyy] = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return "";
  return `${yyyy}-${mm}-${dd}`;
}

export function DateInput({ value, onChange, className, required, error, min, max }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  // Sync when parent value changes externally (e.g. form load)
  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = digitsToDisplay(e.target.value);
    setDisplay(formatted);
    onChange(displayToIso(formatted));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/YYYY"
      value={display}
      onChange={handleChange}
      required={required}
      className={className}
      data-date-min={min}
      data-date-max={max}
    />
  );
}
