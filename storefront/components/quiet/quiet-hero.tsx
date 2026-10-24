"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/** Full-screen opening: the gold wordmark rises and draws together, a light sweeps across it, and it spreads apart as you scroll. */
export function QuietHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const spread = useTransform(scrollYProgress, [0, 1], reduce ? ["0em", "0em"] : ["0em", "0.35em"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);
  const sealRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);

  return (
    <section ref={ref} aria-label="Rizzova" className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-[radial-gradient(60%_55%_at_50%_48%,#341a57_0%,var(--color-ink)_72%)]">
      <h1 className="sr-only">Rizzova: everyday things, chosen carefully</h1>
      {/* Thin gold rings behind the wordmark */}
      <motion.div aria-hidden style={{ rotate: sealRotate }} className="pointer-events-none absolute left-1/2 top-[46%] aspect-square w-[min(92vw,60rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-accent)]/15">
        <span className="absolute inset-[9%] rounded-full border border-dashed border-[var(--color-accent)]/20" />
        <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent)] shadow-[0_0_18px_4px_rgb(217_180_90/0.6)]" />
      </motion.div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <motion.img
          src="/brand/logo-mark.png" alt="" width={88} height={88}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="size-16 drop-shadow-[0_0_24px_rgb(217_180_90/0.45)] sm:size-22"
        />
        <motion.p aria-hidden style={{ opacity: fade, letterSpacing: spread }} className="select-none font-[family-name:var(--font-serif)] uppercase leading-[0.85]">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 40, letterSpacing: "0.25em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0em" }}
            transition={{ duration: 1.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rz-gold block pb-[0.06em]"
            style={{ fontSize: "clamp(4.4rem, 26vw, 19rem)" }}
          >
            Rizzova
          </motion.span>
        </motion.p>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.45em] text-[var(--color-muted)] sm:text-xs"
        >
          Everyday luxe · Delivered
        </motion.p>
      </div>

      <div className="container-x grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-4 pb-8 text-[10px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:text-xs">
        <p className="font-[family-name:var(--font-serif)] text-lg italic leading-tight text-[var(--color-accent)] sm:text-2xl">Find it once.<br />Love it daily.</p>
        <p aria-hidden className="hidden flex-col items-center gap-2 font-[family-name:var(--font-mono)] tracking-[0.3em] sm:flex">
          <span className="text-[var(--color-muted)]">SCROLL</span><span className="h-8 w-px animate-pulse bg-[var(--color-accent)]" />
        </p>
        <p className="text-right font-[family-name:var(--font-mono)] uppercase leading-relaxed tracking-[0.14em] text-[var(--color-muted)] sm:tracking-[0.18em]">
          Free delivery AU &amp; US<br />UAE A$5<br />Australian owned
        </p>
      </div>
    </section>
  );
}
