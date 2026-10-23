"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { spring } from "@/lib/tokens";
import type { Product } from "@/lib/types";

const LINES = ["Everyday", "finds,", "delivered."] as const;

interface Props {
  featured: Product;
  productCount: number;
  categoryCount: number;
}

export function EditorialHero({ featured, productCount, categoryCount }: Props) {
  const reduce = useReducedMotion();
  const price = featured.variants[0]?.priceCents ?? 0;

  return (
    <section aria-labelledby="hero-h" className="container-x grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:pt-16">
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          Rizzova · Edition 01 · Australia &amp; New Zealand
        </p>
        <h1 id="hero-h" className="mt-5 font-[family-name:var(--font-poster)] uppercase leading-[0.84] tracking-tight" style={{ fontSize: "clamp(4.2rem, 13vw, 12.5rem)" }}>
          {LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className={`block ${i === 2 ? "text-[var(--color-accent)]" : ""}`}
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: 0 }}
                transition={{ ...spring.soft, delay: reduce ? 0 : 0.08 * i }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <p className="mt-6 font-[family-name:var(--font-serif)] text-2xl italic text-[var(--color-fg)]/85 sm:text-3xl">Such a good-looking find.</p>
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
          <div><dt>Products</dt><dd className="mt-1 text-2xl text-[var(--color-fg)]">{productCount}</dd></div>
          <div><dt>Categories</dt><dd className="mt-1 text-2xl text-[var(--color-fg)]">{categoryCount}</dd></div>
          <div><dt>Bundle &amp; save</dt><dd className="mt-1 text-2xl text-[var(--color-fg)]">up to 15%</dd></div>
        </dl>
        <Link href="#the-edit" className="btn-brutal mt-8 inline-flex h-13 items-center gap-2 px-6 py-3.5 text-base">
          Shop the edit <ArrowUpRight className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        <motion.div
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.soft, delay: reduce ? 0 : 0.2 }}
          className="aspect-square overflow-hidden rounded-full border-2 border-white/10 bg-white shadow-[var(--shadow-glass)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featured.images[0]} alt={featured.title} className="size-full object-cover" fetchPriority="high" />
        </motion.div>

        {/* Rotating seal */}
        <div className="absolute -left-2 bottom-4 size-32 sm:size-36" aria-hidden>
          <svg viewBox="0 0 200 200" className="animate-spin-slow size-full">
            <defs>
              <path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
            </defs>
            <circle cx="100" cy="100" r="98" fill="var(--color-accent)" />
            <text fill="var(--color-accent-ink)" fontSize="19" fontWeight="700" letterSpacing="4" fontFamily="var(--font-jetbrains), monospace">
              <textPath href="#seal-path">NEW IN • BUNDLE &amp; SAVE • RIZZOVA •</textPath>
            </text>
          </svg>
          <span className="absolute inset-0 grid place-items-center font-[family-name:var(--font-poster)] text-3xl text-[var(--color-accent-ink)]">R</span>
        </div>

        <Link
          href={`/product/${featured.slug}`}
          className="glass-strong absolute -right-1 top-6 max-w-[220px] rounded-2xl p-3 text-sm shadow-[var(--shadow-brutal-sm)] transition-transform hover:-translate-y-0.5 sm:right-0"
        >
          <span className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-accent)]">Most loved</span>
          <span className="mt-1 line-clamp-2 font-medium leading-snug">{featured.title}</span>
          <span className="mt-1 block font-[family-name:var(--font-mono)]">{formatMoney(price, featured.currency)}</span>
        </Link>
      </div>
    </section>
  );
}
