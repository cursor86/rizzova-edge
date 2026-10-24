"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/** Brand film: muted autoplay loop (paused when reduced motion is on), with play and sound controls. */
export function BrandFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) { v.pause(); return; }
    v.play().catch(() => setPlaying(false));
  }, [reduce]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  return (
    <section aria-labelledby="film-h" className="container-x grid items-center gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent)]">The Rizzova collection</p>
        <h2 id="film-h" className="mt-3 font-[family-name:var(--font-poster)] text-6xl uppercase leading-[0.9] sm:text-8xl">Home &amp;<br />comfort.</h2>
        <p className="mt-5 max-w-sm font-[family-name:var(--font-serif)] text-2xl italic text-[var(--color-fg)]/85">Kitchen pieces, cosy drinkware and little upgrades for every room.</p>
      </div>
      <div className="relative overflow-hidden rounded-[var(--radius-panel)] border-2 border-[var(--color-accent)]/40 shadow-[8px_8px_0_0_var(--color-accent)]">
        <video
          ref={ref}
          poster="/brand/rizzova-film-poster.jpg"
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="aspect-square w-full bg-[var(--color-ink-2)] object-cover"
          aria-label="Rizzova promotional film"
        >
          <source src="/brand/rizzova-film.mp4" type="video/mp4" />
          <source src="/brand/rizzova-film.webm" type="video/webm" />
        </video>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause film" : "Play film"} className="glass-strong grid size-11 place-items-center rounded-full">
            {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
          </button>
          <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted} className="glass-strong grid size-11 place-items-center rounded-full">
            {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
    </section>
  );
}
