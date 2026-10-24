"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Product } from "@/lib/types";

/** Full-screen opening: a giant wordmark with one product in a soft circle, and almost nothing else. */
export function QuietHero({ product }: { product: Product }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.18]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} aria-label="Rizzova" className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-[var(--color-paper)] text-[var(--color-paper-ink)]">
      <div className="relative flex flex-1 items-center justify-center">
        <h1 className="sr-only">Rizzova: everyday things, chosen carefully</h1>
        <motion.p aria-hidden style={{ opacity: fade }} className="select-none font-[family-name:var(--font-display)] font-black uppercase leading-none tracking-[-0.06em]">
          <span style={{ fontSize: "clamp(3.6rem, 16.5vw, 17rem)" }}>Rizzova</span>
        </motion.p>
        <motion.div style={{ scale, y }} className="absolute grid aspect-square w-[min(38vw,22rem)] place-items-center rounded-full bg-white shadow-[0_40px_120px_-30px_rgb(42_22_69/0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt={product.title} className="size-[78%] rounded-full object-contain mix-blend-multiply" />
        </motion.div>
      </div>
      <div className="container-x grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-4 pb-8 text-[10px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:text-xs">
        <p className="font-[family-name:var(--font-serif)] text-lg italic leading-tight sm:text-2xl">Find it once.<br />Love it daily.</p>
        <p aria-hidden className="hidden flex-col items-center gap-2 sm:flex font-[family-name:var(--font-mono)] tracking-[0.3em]">
          SCROLL<span className="h-8 w-px animate-pulse bg-current" />
        </p>
        <p className="text-right font-[family-name:var(--font-mono)] uppercase leading-relaxed tracking-[0.14em] text-black/60 sm:tracking-[0.18em]">
          Free delivery AU &amp; US<br />UAE A$5<br />Australian owned
        </p>
      </div>
    </section>
  );
}
