import { Asterisk } from "lucide-react";

interface Props {
  items: string[];
  tone?: "ink" | "accent";
  tilt?: number;
  durationSeconds?: number;
}

/** Endless ribbon of words. The second copy is decorative only, so screen readers hear the list once. */
export function Marquee({ items, tone = "ink", tilt = -2, durationSeconds = 28 }: Props) {
  const colours = tone === "ink"
    ? "bg-[var(--color-paper-ink)] text-[var(--color-paper)] border-y-2 border-[var(--color-paper)]/10"
    : "bg-[var(--color-accent)] text-[var(--color-accent-ink)]";
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center gap-6 px-6 font-[family-name:var(--font-poster)] text-2xl uppercase tracking-wide sm:text-4xl">
          {item}
          <Asterisk className="size-6 shrink-0 sm:size-8" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    // Outer box clips; the tilted band is wider than the screen so its corners never show.
    <div className="relative z-10 overflow-hidden py-6">
      <div className={`${colours} -mx-10 py-3 sm:py-4`} style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="animate-marquee flex w-max hover:[animation-play-state:paused]" style={{ ["--marquee-duration" as string]: `${durationSeconds}s` }}>
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
