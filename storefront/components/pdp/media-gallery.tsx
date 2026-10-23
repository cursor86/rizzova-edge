"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { spring } from "@/lib/tokens";
import { ProductArt } from "../product-art";

export type MediaItem = { kind: "image"; src: string; alt: string } | { kind: "video"; src: string; poster?: string; alt: string };

interface Props {
  media: MediaItem[];
  title: string;
  seed: number;
  category: string;
  isSample: boolean;
}

/** Stage + thumbnail rail. Arrow keys move through media when the gallery has focus. */
export function MediaGallery({ media, title, seed, category, isSample }: Props) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const count = Math.max(media.length, 1);
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const current = media[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${title} media`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className={`grid grid-cols-[minmax(0,1fr)] gap-3 ${media.length > 1 ? "lg:grid-cols-[88px_minmax(0,1fr)]" : ""}`}
    >
      <div className="glass relative order-1 overflow-hidden rounded-[var(--radius-panel)] lg:order-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={spring.soft}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
          >
            {current?.kind === "video" ? (
              <video src={current.src} poster={current.poster} controls playsInline className="aspect-square w-full object-cover" aria-label={current.alt} />
            ) : (
              <ProductArt src={current?.src} alt={current?.alt ?? title} seed={seed} label={category || "Rizzova"} aspect="1 / 1" isSample={isSample} />
            )}
          </motion.div>
        </AnimatePresence>
        {count > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex justify-between">
            <button type="button" onClick={() => go(-1)} aria-label="Previous media" className="glass-strong grid size-10 place-items-center rounded-full"><ChevronLeft className="size-5" aria-hidden /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next media" className="glass-strong grid size-10 place-items-center rounded-full"><ChevronRight className="size-5" aria-hidden /></button>
          </div>
        )}
      </div>
      {media.length > 1 && (
        <div role="tablist" aria-label="Choose media" className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col">
          {media.map((m, i) => (
            <button
              key={`${m.src}-${i}`}
              role="tab"
              type="button"
              aria-selected={i === index}
              aria-label={`Show media ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${i === index ? "border-[var(--color-accent)]" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.kind === "video" ? (m.poster ?? "") : m.src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
