import Link from "next/link";
import { POLICIES, STORE, type Policy } from "@/lib/policies";

export function PolicyPage({ policy }: { policy: Policy }) {
  return (
    <article className="container-x grid gap-10 pt-12 lg:grid-cols-[220px_minmax(0,1fr)]" aria-labelledby="policy-h">
      <nav aria-label="Store policies" className="order-2 lg:order-1">
        <ul className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col">
          {POLICIES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} aria-current={p.slug === policy.slug ? "page" : undefined}
                className={`block rounded-[var(--radius-control)] px-3 py-2 text-sm transition-colors ${p.slug === policy.slug ? "bg-[var(--color-accent)] font-semibold text-[var(--color-accent-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}>
                {p.title}
              </Link>
            </li>
          ))}
          <li><Link href="/contact" className="block rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">Contact us</Link></li>
        </ul>
      </nav>
      <div className="order-1 max-w-3xl lg:order-2">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">Last updated {STORE.updated}</p>
        <h1 id="policy-h" className="mt-3 font-[family-name:var(--font-poster)] text-5xl uppercase leading-none sm:text-7xl">{policy.title}</h1>
        <p className="mt-5 font-[family-name:var(--font-serif)] text-2xl italic text-[var(--color-fg)]/85">{policy.intro}</p>
        <div className="mt-10 space-y-8">
          {policy.sections.map((s) => (
            <section key={s.heading} className="border-t border-white/10 pt-6">
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              {s.body.map((para, i) => <p key={i} className="mt-3 leading-relaxed text-[var(--color-fg)]/80">{para}</p>)}
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-[var(--color-muted)]">Questions? Email <a className="underline hover:text-[var(--color-accent)]" href={`mailto:${STORE.email}`}>{STORE.email}</a>.</p>
      </div>
    </article>
  );
}
