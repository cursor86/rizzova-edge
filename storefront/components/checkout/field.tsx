"use client";

import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ name, label, error, hint, className = "", ...input }: Props) {
  const id = `f-${name}`;
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm text-[var(--color-muted)]">{label}</label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`glass h-11 rounded-[var(--radius-control)] px-3 text-[15px] outline-none transition-colors focus:border-[var(--color-accent)] ${error ? "border-[var(--color-danger)]" : ""}`}
        {...input}
      />
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-[var(--color-muted)]">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
