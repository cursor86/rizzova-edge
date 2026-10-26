"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { fromPrice, shortName } from "./shared";

/** Card slots in the collage, as percentages of the stage so it scales from phone to desktop. */
const SLOTS = [
  { box: "left-[8%] top-[16%] w-[60%] z-20", ratio: "aspect-[4/3]", band: "bg-[var(--color-ink)]/85", depth: 30 },
  { box: "right-0 top-0 w-[44%] z-10", ratio: "aspect-[5/4]", band: "bg-[#c99a2e]", depth: 60 },
  { box: "left-0 bottom-[2%] w-[30%] z-30", ratio: "aspect-[3/4]", band: "bg-[#a63d6b]", depth: -20 },
  { box: "right-[3%] bottom-0 w-[40%] z-30", ratio: "aspect-[4/3]", band: "bg-[#4b3fb0]", depth: -45 },
  { box: "right-[30%] top-[2%] w-[18%] z-0 hidden sm:block", ratio: "aspect-square", band: "bg-[#2f8f7f]", depth: 90 },
];

/** Opening screen: a headline on the left and a layered collage of real products on the right. */
export function HeroCollage({ products }: { products: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  return (
    <section ref={ref} aria-labelledby="hero-h" className="relative overflow-hidden bg-[linear-gradient(135deg,#5b2a9a_0%,#3a1d6e_45%,var(--color-ink)_100%)]">
      <span aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-[#8c46d2]/30 blur-3xl" />
      <div className="container-x relative grid min-h-[calc(100svh-4rem)] grid-cols-[minmax(0,1fr)] items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.png" alt="" width={56} height={56} className="size-14 drop-shadow-[0_0_20px_rgb(217_180_90/0.5)]" />
          <h1 id="hero-h" className="mt-6 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            Everyday finds.<br /><span className="rz-gold">Delivered free.</span>
          </h1>
          <p className="mt-6 max-w-sm font-[family-name:var(--font-mono)] text-xs uppercase leading-relaxed tracking-[0.2em] text-[var(--color-muted)]">
            Kitchen · Pets · Kids · Tech · Home<br />Free delivery to Australia &amp; the US
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#the-edit" className="btn-brutal inline-flex h-12 items-center px-6">Shop the edit</Link>
            <Link href="/#explore-h" className="glass inline-flex h-12 items-center rounded-[var(--radius-control)] px-6 font-semibold">Explore</Link>
          </div>
        </motion.div>

        <div className="relative mx-auto aspect-[6/5] w-full max-w-[44rem]">
          {products.slice(0, SLOTS.length).map((p, i) => (
            <CollageCard key={p.id} product={p} slot={SLOTS[i]!} index={i} progress={scrollYProgress} reduce={!!reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollageCard({ product: p, slot, index, progress, reduce }: {
  product: Product; slot: (typeof SLOTS)[number]; index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"]; reduce: boolean;
}) {
  const y = useTransform(progress, [0, 1], reduce ? [0, 0] : [0, -slot.depth * 3]);
  return (
    <motion.div
      style={{ y }}
      initial={reduce ? false : { opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${slot.box}`}
    >
      <Link href={`/product/${p.slug}`} className="group block overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-[-0.5deg]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images[0]} alt={p.title} className={`w-full bg-white object-cover ${slot.ratio} transition-transform duration-700 group-hover:scale-105`} />
        <span className={`flex items-center justify-between gap-2 px-3 py-2 text-white ${slot.band}`}>
          <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs">{shortName(p.title, 3)}</span>
          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] sm:text-xs">{formatMoney(fromPrice(p), p.currency)}</span>
        </span>
      </Link>
    </motion.div>
  );
}
