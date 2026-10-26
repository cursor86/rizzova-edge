import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ClearCart } from "./clear-cart";

export const metadata = { title: "Order confirmed · Rizzova", robots: { index: false } };

/** Stripe sends customers here after paying. Payment is confirmed by the webhook, not by this page. */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = id.replace(/[^a-z0-9-]/gi, "").slice(0, 8).toUpperCase();
  return (
    <div className="container-x py-20">
      <ClearCart />
      <div className="glass mx-auto max-w-lg rounded-[var(--radius-panel)] p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-[var(--color-accent)]" aria-hidden />
        <h1 className="mt-4 font-[family-name:var(--font-serif)] text-4xl">Thank you!</h1>
        <p className="mt-3 text-[var(--color-muted)]">Your order is in. A receipt is on its way to your email, and we&apos;ll send tracking as soon as it ships (usually 2–3 weeks to arrive).</p>
        <p className="mt-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[var(--color-muted)]">REF {ref}</p>
        <p className="mt-4 text-sm text-[var(--color-muted)]">Questions? <a className="underline" href="mailto:support@rizzova.com">support@rizzova.com</a></p>
        <Link href="/" className="btn-brutal mt-6 inline-flex h-11 items-center px-5">Keep shopping</Link>
      </div>
    </div>
  );
}
