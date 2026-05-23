"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;                   // YYYY-MM-DD (or "")
  onChange: (v: string) => void;   // emits YYYY-MM-DD
  className?: string;
  required?: boolean;
  min?: string;                    // YYYY-MM-DD
  max?: string;                    // YYYY-MM-DD
  error?: boolean;
}

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

export function DatePicker({ value, onChange, className, required, min, max, error }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected  = parseIso(value);
  const minDate   = parseIso(min ?? "");
  const maxDate   = parseIso(max ?? "");

  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after:  maxDate }] : []),
  ];

  function handleSelect(date: Date | undefined) {
    if (date) onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-aeromine-500 transition-colors",
            error ? "border-red-400 ring-1 ring-red-400" : "border-slate-200",
            !selected && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
          {selected ? format(selected, "dd/MM/yyyy") : "DD/MM/YYYY"}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled}
            defaultMonth={selected ?? (minDate ?? undefined)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
