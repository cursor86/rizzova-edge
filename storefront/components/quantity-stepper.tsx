"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
}

export function QuantityStepper({ value, max, onChange, label }: Props) {
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="glass inline-flex items-center rounded-[var(--radius-control)]">
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`Decrease quantity of ${label}`} className="grid size-9 place-items-center hover:text-[var(--color-accent)]">
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="w-8 text-center font-[family-name:var(--font-mono)] text-sm">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase quantity of ${label}`} className="grid size-9 place-items-center hover:text-[var(--color-accent)] disabled:opacity-30">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
