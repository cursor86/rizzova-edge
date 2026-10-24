import { sectionLabel } from "./shared";

const STEPS = [
  { t: "Day 0", h: "You order", d: "Pay securely with Stripe. You get a receipt straight away." },
  { t: "Day 1–3", h: "We send it on", d: "Your order goes to our supplier, who packs and dispatches it." },
  { t: "Dispatch", h: "Tracked", d: "We email your tracking number as soon as it moves." },
  { t: "2–3 weeks", h: "At your door", d: "Free to Australia and the US. Problems? We fix them." },
];

/** "How it works" timeline, in the place a brand story would sit. Facts only, no invented history. */
export function HowItWorks({ section }: { section: number }) {
  return (
    <section aria-labelledby="how-h" className="bg-[var(--color-ink-2)] py-24 text-[var(--color-fg)] sm:py-32">
      <div className="container-x">
        <p className="border-b border-white/15 pb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">{sectionLabel(section, "How it works")}</p>
        <h2 id="how-h" className="mt-10 max-w-3xl font-[family-name:var(--font-serif)] leading-[1.02]" style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}>
          Quietly chosen. <span className="italic text-[var(--color-accent)]">Honestly priced.</span>
        </h2>
        <ol className="relative mt-14 grid grid-cols-[minmax(0,1fr)] gap-10 sm:grid-cols-4 sm:gap-6">
          <span aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-px bg-white/20 sm:block" />
          {STEPS.map((s) => (
            <li key={s.h} className="relative min-w-0">
              <span aria-hidden className="block size-[15px] rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-ink)]" />
              <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{s.t}</p>
              <p className="mt-1 text-lg font-semibold">{s.h}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
