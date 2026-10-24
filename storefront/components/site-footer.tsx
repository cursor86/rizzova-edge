import Link from "next/link";
import { POLICIES, STORE } from "@/lib/policies";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold">RIZZ<span className="text-[var(--color-accent)]">OVA</span></p>
          <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">Everyday finds, delivered across Australia and New Zealand.</p>
        </div>
        <nav aria-label="Help">
          <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-muted)]">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/contact" className="hover:text-[var(--color-accent)]">Contact us</Link></li>
            {POLICIES.filter((p) => ["shipping", "refunds", "payments"].includes(p.slug)).map((p) => (
              <li key={p.slug}><Link href={`/${p.slug}`} className="hover:text-[var(--color-accent)]">{p.title}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-muted)]">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {POLICIES.filter((p) => ["terms", "privacy"].includes(p.slug)).map((p) => (
              <li key={p.slug}><Link href={`/${p.slug}`} className="hover:text-[var(--color-accent)]">{p.title}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="container-x pb-8 text-xs text-[var(--color-muted)]">© 2026 Rizzova · ABN {STORE.abn} · {STORE.email}</p>
    </footer>
  );
}
