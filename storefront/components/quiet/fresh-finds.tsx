import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { fromPrice } from "./shared";

/** Masonry wall of products. Card heights vary with the photo and title, so the wall looks hand-arranged. */
export function FreshFinds({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="fresh-h" className="bg-[var(--color-ink)] pb-20 pt-12">
      <div className="container-x">
        <h2 id="fresh-h" className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">Fresh finds</h2>
        <ul className="mt-4 columns-2 gap-3 md:columns-3 lg:columns-4 [&>li]:mb-3">
          {products.map((p, i) => (
            <li key={p.id} className="break-inside-avoid">
              <Link href={`/product/${p.slug}`} className="group block overflow-hidden rounded-lg bg-[var(--color-ink-2)] ring-1 ring-white/10 transition hover:ring-[var(--color-accent)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]} alt="" loading="lazy" className={`w-full bg-white object-cover ${["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"][i % 4]}`} />
                <span className="block p-3">
                  <span className="line-clamp-2 text-sm">{p.title}</span>
                  <span className="mt-1 block font-[family-name:var(--font-mono)] text-sm text-[var(--color-accent)]">{formatMoney(fromPrice(p), p.currency)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
