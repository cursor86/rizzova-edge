import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

/** Rhythm of media heights that makes the masonry asymmetric without random jumps between renders. */
const ASPECTS = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "1 / 1", "5 / 6"] as const;

export function ProductGrid({ products, label }: { products: Product[]; label: string }) {
  if (products.length === 0) {
    return <p className="glass rounded-[var(--radius-card)] p-8 text-center text-[var(--color-muted)]">No products match that search yet.</p>;
  }
  return (
    <section aria-label={label} className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} aspect={ASPECTS[i % ASPECTS.length] ?? "1 / 1"} />
      ))}
    </section>
  );
}
