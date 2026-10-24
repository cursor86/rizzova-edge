import Link from "next/link";
import type { Product } from "@/lib/types";

/** Brand-family tile colours: gold, plum, violet, teal, rose, amber. */
const TILE = ["#c99a2e", "#6b2f8f", "#4b3fb0", "#2f8f7f", "#a63d6b", "#b8661f", "#3f6fb0", "#7a5a1f"];

export interface Tile { name: string; count: number; cover: string }

export function tilesFrom(products: Product[], n = 8): Tile[] {
  const byCat = new Map<string, Product[]>();
  for (const p of products) if (p.category && p.images[0]) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
  return [...byCat.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, n)
    .map(([name, list]) => ({ name, count: list.length, cover: list[0]!.images[0]! }));
}

/** "Explore" row: colourful category tiles, a photo on top and a solid band with the name and count. */
export function ExploreTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section aria-labelledby="explore-h" className="bg-[var(--color-ink)] pt-16">
      <div className="container-x">
        <p className="text-center font-[family-name:var(--font-serif)] text-2xl italic text-[var(--color-accent)] sm:text-3xl">Finds everyone will be talking about.</p>
        <div className="mt-10 flex items-baseline justify-between">
          <h2 id="explore-h" className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">Explore</h2>
          <Link href="/#the-edit" className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-fg)]">Everything +</Link>
        </div>
        <ul className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0">
          {tiles.map((t, i) => (
            <li key={t.name} className="w-36 shrink-0 snap-start lg:w-auto">
              <Link href={`/?q=${encodeURIComponent(t.name)}`} className="group block overflow-hidden rounded-lg transition-transform hover:-translate-y-1">
                <span className="block h-20 overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="flex h-20 flex-col items-center justify-center px-2 text-center" style={{ background: TILE[i % TILE.length] }}>
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-white">{t.name}</span>
                  <span className="mt-1 text-[11px] font-semibold text-white/75">{t.count} {t.count === 1 ? "find" : "finds"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
