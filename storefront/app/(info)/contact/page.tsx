import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Clock, FileText } from "lucide-react";
import { STORE } from "@/lib/policies";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <div className="container-x pt-12">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">Customer care</p>
      <h1 className="mt-3 font-[family-name:var(--font-poster)] text-6xl uppercase leading-none sm:text-8xl">Contact us</h1>
      <p className="mt-5 max-w-xl font-[family-name:var(--font-serif)] text-2xl italic text-[var(--color-fg)]/85">Real people, quick answers. Include your order number if you have one.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a href={`mailto:${STORE.email}`} className="glass rounded-[var(--radius-card)] p-5 transition-colors hover:border-[var(--color-accent)]">
          <Mail className="size-6 text-[var(--color-accent)]" aria-hidden />
          <h2 className="mt-4 font-semibold">Email</h2>
          <p className="mt-1 break-all text-[var(--color-muted)]">{STORE.email}</p>
        </a>
        <a href={`tel:${STORE.phoneHref}`} className="glass rounded-[var(--radius-card)] p-5 transition-colors hover:border-[var(--color-accent)]">
          <Phone className="size-6 text-[var(--color-accent)]" aria-hidden />
          <h2 className="mt-4 font-semibold">Phone</h2>
          <p className="mt-1 text-[var(--color-muted)]">{STORE.phone}</p>
        </a>
        <div className="glass rounded-[var(--radius-card)] p-5">
          <Clock className="size-6 text-[var(--color-accent)]" aria-hidden />
          <h2 className="mt-4 font-semibold">Response time</h2>
          <p className="mt-1 text-[var(--color-muted)]">Within 2 business days (Mon–Fri, Melbourne time)</p>
        </div>
        <div className="glass rounded-[var(--radius-card)] p-5">
          <FileText className="size-6 text-[var(--color-accent)]" aria-hidden />
          <h2 className="mt-4 font-semibold">Business</h2>
          <p className="mt-1 text-[var(--color-muted)]">Rizzova · ABN {STORE.abn}</p>
        </div>
      </div>
      <p className="mt-8 text-[var(--color-muted)]">
        Problem with an order? See <Link href="/refunds" className="underline hover:text-[var(--color-accent)]">Refunds &amp; Returns</Link> and <Link href="/shipping" className="underline hover:text-[var(--color-accent)]">Shipping &amp; Delivery</Link>.
      </p>
    </div>
  );
}
