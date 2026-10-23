"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import type { Product } from "@/lib/types";

/** Satellite positions around the centre piece (percent of the stage), with parallax depth. */
const SLOTS = [
  { left: 4, top: 8, size: 150, depth: 1.4 },
  { left: 20, top: 58, size: 120, depth: 0.8 },
  { left: 76, top: 6, size: 130, depth: 1.1 },
  { left: 84, top: 52, size: 150, depth: 1.6 },
  { left: 66, top: 74, size: 110, depth: 0.7 },
  { left: 10, top: 78, size: 100, depth: 1.2 },
] as const;

function Tile({ product, slot, mx, my, index }: { product: Product; slot: (typeof SLOTS)[number]; mx: MotionValue<number>; my: MotionValue<number>; index: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(useTransform(mx, (v) => (reduce ? 0 : v * slot.depth * 46)), { stiffness: 120, damping: 20 });
  const y = useSpring(useTransform(my, (v) => (reduce ? 0 : v * slot.depth * 46)), { stiffness: 120, damping: 20 });
  return (
    <motion.div
      className="absolute"
      style={{ left: `${slot.left}%`, top: `${slot.top}%`, width: slot.size, x, y }}
      initial={reduce ? false : { opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay: reduce ? 0 : 0.06 * index }}
    >
      <Link href={`/product/${product.slug}`} className="group block" aria-label={product.title}>
        <span className="block overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)] transition-transform group-hover:-rotate-2 group-hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
        </span>
        <span className="mt-1.5 block truncate font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-paper-ink)]/70">{product.category || "Rizzova"}</span>
      </Link>
    </motion.div>
  );
}

/** "One store, every part of life": a centre product with satellites that drift with the pointer. */
export function Collage({ centre, satellites }: { centre: Product; satellites: Product[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const tiles = satellites.slice(0, SLOTS.length);

  return (
    <section aria-labelledby="collage-h" className="bg-[var(--color-paper)] text-[var(--color-paper-ink)]">
      <div className="container-x py-20">
        <h2 id="collage-h" className="text-center font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl">
          One store.<br />Every part of life.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center font-[family-name:var(--font-serif)] text-xl italic">Kitchen, play, sleep, travel and the bits in between.</p>

        {/* Desktop: floating stage */}
        <div ref={stage} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }} className="relative mx-auto mt-10 hidden h-[560px] max-w-5xl md:block">
          <Link href={`/product/${centre.slug}`} className="absolute left-1/2 top-1/2 block w-[300px] -translate-x-1/2 -translate-y-1/2" aria-label={centre.title}>
            <span className="block overflow-hidden rounded-[var(--radius-panel)] border-2 border-[var(--color-paper-ink)] bg-white shadow-[8px_8px_0_0_var(--color-paper-ink)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={centre.images[0]} alt="" className="aspect-[4/5] w-full object-cover" />
            </span>
            <span className="mt-3 block text-center text-sm font-semibold">{centre.title}</span>
          </Link>
          {tiles.map((p, i) => {
            const slot = SLOTS[i];
            return slot ? <Tile key={p.id} product={p} slot={slot} mx={mx} my={my} index={i} /> : null;
          })}
        </div>

        {/* Mobile: swipeable row */}
        <ul className="mt-8 flex snap-x gap-3 overflow-x-auto pb-2 md:hidden" aria-label="Featured picks">
          {[centre, ...tiles].map((p) => (
            <li key={p.id} className="w-40 shrink-0 snap-start">
              <Link href={`/product/${p.slug}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]} alt={p.title} loading="lazy" className="aspect-square w-full rounded-xl border border-black/10 bg-white object-cover" />
                <span className="mt-1.5 block truncate font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">{p.category || "Rizzova"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
