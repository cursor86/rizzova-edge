"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { Spec } from "@/lib/types";

/** Tabbed technical specifications (WAI-ARIA tabs pattern) rendered as a definition list. */
export function SpecPanel({ specs }: { specs: Spec[] }) {
  const groups = [...new Set(specs.map((s) => s.group))];
  const [active, setActive] = useState(0);
  const baseId = useId();
  if (groups.length === 0) return null;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + groups.length) % groups.length;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <section aria-labelledby={`${baseId}-h`} className="glass rounded-[var(--radius-panel)] p-5">
      <h2 id={`${baseId}-h`} className="font-[family-name:var(--font-display)] text-base">Specifications</h2>
      <div role="tablist" aria-label="Specification groups" className="mt-4 flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <button
            key={g}
            id={`${baseId}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
            className={`rounded-[var(--radius-chip)] border-2 px-3 py-1 text-sm transition-colors ${i === active ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "border-white/15 hover:border-white/40"}`}
          >
            {g}
          </button>
        ))}
      </div>
      {groups.map((g, i) => (
        <div key={g} id={`${baseId}-panel-${i}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${i}`} hidden={i !== active} className="mt-4">
          <dl className="divide-y divide-white/10">
            {specs.filter((s) => s.group === g).map((s) => (
              <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5 text-sm">
                <dt className="text-[var(--color-muted)]">{s.label}</dt>
                <dd className="font-[family-name:var(--font-mono)]">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
