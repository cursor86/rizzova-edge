import { SHIPPING_ZONES, shippingOptions } from "@/lib/shipping";
import { formatMoney } from "@/lib/money";
import { sectionLabel } from "./shared";

/** Plain statement of where we deliver and what it costs, straight from the checkout's shipping table. */
export function DeliveryBand({ section }: { section: number }) {
  const zones = Object.entries(SHIPPING_ZONES);
  return (
    <section aria-labelledby="delivery-h" className="bg-[var(--color-ink)] pb-24 text-[var(--color-fg)] sm:pb-32">
      <div className="container-x">
        <h2 id="delivery-h" className="border-b border-white/15 pb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">{sectionLabel(section, "Delivery")}</h2>
        <p className="mt-10 max-w-3xl font-[family-name:var(--font-serif)] leading-[1.02]" style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}>
          Free to your door. <span className="italic text-[var(--color-accent)]">Almost everywhere we go.</span>
        </p>
        <ul className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-3">
          {zones.map(([code, zone]) => {
            const opts = shippingOptions(code);
            return (
              <li key={code} className="bg-[var(--color-ink-2)] p-6">
                <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[var(--color-muted)]">{code}</p>
                <p className="mt-2 text-lg font-semibold">{zone.name}</p>
                {opts.map((o) => (
                  <p key={o.id} className="mt-3 flex justify-between gap-4 text-sm">
                    <span>{o.label} · {o.estimate}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[var(--color-accent)]">{o.cents === 0 ? "Free" : formatMoney(o.cents, "AUD")}</span>
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-[var(--color-muted)]">Estimates after dispatch. Every order is tracked. Prices in AUD.</p>
      </div>
    </section>
  );
}
