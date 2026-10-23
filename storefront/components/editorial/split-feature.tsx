import Link from "next/link";
import type { Product } from "@/lib/types";

export interface CategoryFeature {
  name: string;
  count: number;
  cover: Product;
}

/** Two-up editorial panels for the biggest categories. */
export function SplitFeature({ features }: { features: CategoryFeature[] }) {
  return (
    <section aria-label="Shop by category" className="container-x grid gap-4 py-20 md:grid-cols-2">
      {features.map((f, i) => (
        <Link
          key={f.name}
          href={`/?q=${encodeURIComponent(f.name)}`}
          className="group relative block overflow-hidden rounded-[var(--radius-panel)] bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.cover.images[0]} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:aspect-[5/6]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
          <span className="absolute left-5 top-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-white/80">
            {String(i + 1).padStart(2, "0")} / {f.count} pieces
          </span>
          <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
            <span className="font-[family-name:var(--font-poster)] text-4xl uppercase leading-[0.9] sm:text-6xl">{f.name}</span>
            <span className="shrink-0 rounded-[var(--radius-chip)] border-2 border-white px-4 py-2 text-sm font-semibold transition-colors group-hover:bg-white group-hover:text-black">Shop</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
