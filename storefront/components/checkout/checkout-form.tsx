"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { useCart } from "@/context/cart-context";
import {
  COUNTRIES, contactSchema, deliverySchema, fieldErrors,
  type CheckoutResponse, type ContactInput, type CountryCode, type DeliveryInput,
} from "@/lib/checkout-schema";
import { formatMoney } from "@/lib/money";
import { shippingOption, shippingOptions, type ShippingMethod } from "@/lib/shipping";
import { track } from "@/lib/telemetry";
import { spring } from "@/lib/tokens";
import { Field } from "./field";

const STEPS = ["Contact", "Delivery", "Review"] as const;
type Step = 0 | 1 | 2;
const CURRENCY = "AUD";

const emptyContact: ContactInput = { email: "", phone: "" };
const emptyDelivery: DeliveryInput = { name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "AU" };

export function CheckoutForm() {
  const { lines, totals, clear } = useCart();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(0);
  const [contact, setContact] = useState<ContactInput>(emptyContact);
  const [delivery, setDelivery] = useState<DeliveryInput>(emptyDelivery);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const stepStart = useRef<number>(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    stepStart.current = Date.now();
    track({ name: "checkout_step_view", step: STEPS[step] });
    headingRef.current?.focus();
  }, [step]);

  const options = shippingOptions(delivery.country);
  const route = shippingOption(delivery.country, method) ?? options[0]!;
  const priceLabel = (cents: number) => (cents === 0 ? "Free" : formatMoney(cents, CURRENCY));
  const grandTotal = totals.totalCents + route.cents;

  const fail = (stepName: string, errs: Record<string, string>) => {
    setErrors(errs);
    track({ name: "checkout_validation_error", step: stepName, fields: Object.keys(errs) });
    const first = Object.keys(errs)[0];
    if (first) document.getElementById(`f-${first}`)?.focus();
  };

  const next = () => {
    const schema = step === 0 ? contactSchema : deliverySchema;
    const parsed = schema.safeParse(step === 0 ? contact : delivery);
    if (!parsed.success) return fail(STEPS[step], fieldErrors(parsed.error));
    setErrors({});
    track({ name: "checkout_step_complete", step: STEPS[step], ms: Date.now() - stepStart.current });
    setStep((s) => (s < 2 ? ((s + 1) as Step) : s));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 2) return next();
    if (totals.hasStockIssues || lines.length === 0) return;
    setSubmitting(true);
    setResult(null);
    track({ name: "checkout_submit", lines: lines.length, valueCents: grandTotal });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact,
          delivery: { ...delivery, line2: delivery.line2 || undefined },
          lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, ...(l.bundleId ? { bundleId: l.bundleId } : {}) })),
          shippingMethod: route.id,
        }),
      });
      const body = (await res.json()) as CheckoutResponse;
      setResult(body);
      if (body.ok && body.mode === "live") {
        track({ name: "checkout_result", outcome: "redirect" });
        window.location.assign(body.checkoutUrl);
        return;
      }
      if (body.ok) {
        track({ name: "checkout_result", outcome: "preview" });
        clear();
      } else {
        track({ name: "checkout_result", outcome: "error", code: body.code });
      }
    } catch {
      const offline: CheckoutResponse = { ok: false, code: "upstream", message: "We couldn't reach the store. Check your connection and try again." };
      setResult(offline);
      track({ name: "checkout_result", outcome: "error", code: "network" });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.ok && result.mode === "preview") {
    return (
      <div role="status" className="glass mx-auto max-w-lg rounded-[var(--radius-panel)] p-8 text-center">
        <Check className="mx-auto size-10 text-[var(--color-signal)]" aria-hidden />
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl">Preview order {result.orderNumber}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{result.message}</p>
        <Link href="/" className="btn-brutal mt-6 inline-flex h-11 items-center px-5">Back to shop</Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="glass mx-auto max-w-lg rounded-[var(--radius-panel)] p-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Your cart is empty</h1>
        <Link href="/" className="btn-brutal mt-6 inline-flex h-11 items-center px-5">Browse products</Link>
      </div>
    );
  }

  const setC = (k: keyof ContactInput, v: string) => setContact((c) => ({ ...c, [k]: v }));
  const setD = (k: keyof DeliveryInput, v: string) => setDelivery((d) => ({ ...d, [k]: v }));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <form onSubmit={submit} noValidate aria-labelledby="checkout-h" className="glass rounded-[var(--radius-panel)] p-6">
        <ol className="mb-6 flex gap-2" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined} className={`flex-1 rounded-[var(--radius-chip)] border-2 px-3 py-1.5 text-center text-xs font-semibold ${i === step ? "border-[var(--color-accent)] text-[var(--color-fg)]" : i < step ? "border-[var(--color-signal)]/50 text-[var(--color-signal)]" : "border-white/10 text-[var(--color-muted)]"}`}>
              {i < step ? "✓ " : `${i + 1}. `}{label}
            </li>
          ))}
        </ol>
        <h1 id="checkout-h" ref={headingRef} tabIndex={-1} className="font-[family-name:var(--font-display)] text-xl outline-none">{STEPS[step]}</h1>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={spring.soft}
            className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2"
          >
            {step === 0 && (
              <>
                <Field name="email" label="Email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setC("email", e.target.value)} error={errors.email} hint="For your receipt and tracking number" className="sm:col-span-2" />
                <Field name="phone" label="Phone" type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setC("phone", e.target.value)} error={errors.phone} hint="The courier may need it" className="sm:col-span-2" />
              </>
            )}
            {step === 1 && (
              <>
                <Field name="name" label="Full name" autoComplete="name" value={delivery.name} onChange={(e) => setD("name", e.target.value)} error={errors.name} className="sm:col-span-2" />
                <Field name="line1" label="Street address" autoComplete="address-line1" value={delivery.line1} onChange={(e) => setD("line1", e.target.value)} error={errors.line1} className="sm:col-span-2" />
                <Field name="line2" label="Apartment, unit (optional)" autoComplete="address-line2" value={delivery.line2 ?? ""} onChange={(e) => setD("line2", e.target.value)} error={errors.line2} className="sm:col-span-2" />
                <Field name="city" label="Suburb / city" autoComplete="address-level2" value={delivery.city} onChange={(e) => setD("city", e.target.value)} error={errors.city} />
                <Field name="state" label="State / region" autoComplete="address-level1" value={delivery.state} onChange={(e) => setD("state", e.target.value)} error={errors.state} />
                <Field name="postalCode" label={delivery.country === "US" ? "ZIP code" : delivery.country === "AE" ? "PO box (optional)" : "Postcode"} inputMode={delivery.country === "AE" ? "text" : "numeric"} autoComplete="postal-code" value={delivery.postalCode} onChange={(e) => setD("postalCode", e.target.value)} error={errors.postalCode} />
                <div className="grid gap-1.5">
                  <label htmlFor="f-country" className="text-sm text-[var(--color-muted)]">Country</label>
                  <select id="f-country" name="country" autoComplete="country" value={delivery.country} onChange={(e) => setD("country", e.target.value)} className="glass h-11 rounded-[var(--radius-control)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]">
                    {(Object.keys(COUNTRIES) as CountryCode[]).map((c) => <option key={c} value={c} className="bg-[var(--color-ink-2)]">{COUNTRIES[c]}</option>)}
                  </select>
                </div>
                <fieldset className="grid min-w-0 gap-2 sm:col-span-2">
                  <legend className="mb-1 text-sm text-[var(--color-muted)]">Delivery</legend>
                  {options.map((o) => (
                    <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-3 py-2.5 text-sm ${route.id === o.id ? "border-[var(--color-accent)]" : "border-white/10"}`}>
                      <span className="flex items-center gap-2.5">
                        <input type="radio" name="shippingMethod" value={o.id} checked={route.id === o.id} onChange={() => setMethod(o.id)} className="accent-[var(--color-accent)]" />
                        <span><span className="font-semibold">{o.label}</span> · {o.estimate}</span>
                      </span>
                      <span className="font-[family-name:var(--font-mono)]">{priceLabel(o.cents)}</span>
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            {step === 2 && (
              <dl className="grid gap-3 text-sm sm:col-span-2">
                <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Contact</dt><dd className="text-right">{contact.email}<br />{contact.phone}</dd></div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-muted)]">Deliver to</dt>
                  <dd className="text-right">{delivery.name}<br />{delivery.line1}{delivery.line2 ? `, ${delivery.line2}` : ""}<br />{delivery.city} {delivery.state} {delivery.postalCode}<br />{COUNTRIES[delivery.country as CountryCode]}</dd>
                </div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Shipping</dt><dd className="text-right">{route.label}, {route.estimate} · {priceLabel(route.cents)}</dd></div>
              </dl>
            )}
          </motion.div>
        </AnimatePresence>

        {result && !result.ok && (
          <div role="alert" className="mt-5 flex gap-2 rounded-2xl border border-[var(--color-danger)]/50 bg-[var(--color-danger)]/10 px-3 py-2.5 text-sm text-[var(--color-danger)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{result.message}{result.problems?.length ? " Update your cart and try again." : ""}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => { setErrors({}); setStep((s) => (s > 0 ? ((s - 1) as Step) : s)); }} className="glass flex h-12 items-center gap-2 rounded-[var(--radius-control)] px-4 text-sm">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
          ) : <span />}
          <button type="submit" disabled={submitting || (step === 2 && totals.hasStockIssues)} aria-busy={submitting} className="btn-brutal flex h-12 items-center gap-2 px-6">
            {submitting ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Starting payment…</>
              : step < 2 ? <>Continue <ArrowRight className="size-4" aria-hidden /></>
              : <><Lock className="size-4" aria-hidden /> Pay {formatMoney(grandTotal, CURRENCY)}</>}
          </button>
        </div>
      </form>

      <aside aria-labelledby="summary-h" className="glass h-fit rounded-[var(--radius-panel)] p-6 lg:sticky lg:top-24">
        <h2 id="summary-h" className="font-[family-name:var(--font-display)] text-base">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="line-clamp-1">{l.quantity} × {l.title}</span>
                <span className="block text-xs text-[var(--color-muted)]">{l.variantLabel}{l.bundleRate > 0 ? ` · bundle −${Math.round(l.bundleRate * 100)}%` : ""}</span>
                {l.shortBy > 0 && <span className="block text-xs text-[var(--color-danger)]">Only {l.stock} available</span>}
              </span>
              <span className="font-[family-name:var(--font-mono)]">{formatMoney(l.lineTotalCents, CURRENCY)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-[family-name:var(--font-mono)]">{formatMoney(totals.subtotalCents, CURRENCY)}</dd></div>
          {totals.bundleSavingsCents > 0 && <div className="flex justify-between text-[var(--color-signal)]"><dt>Bundle savings</dt><dd className="font-[family-name:var(--font-mono)]">−{formatMoney(totals.bundleSavingsCents, CURRENCY)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd className="font-[family-name:var(--font-mono)]">{priceLabel(route.cents)}</dd></div>
          <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd className="font-[family-name:var(--font-mono)]">{formatMoney(grandTotal, CURRENCY)}</dd></div>
        </dl>
        <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)]"><Lock className="size-3" aria-hidden /> Card details are entered on Stripe&apos;s secure page, never on this site.</p>
      </aside>
    </div>
  );
}
