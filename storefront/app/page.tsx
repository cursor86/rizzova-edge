import { ProductGrid } from "@/components/product-grid";
import { isSampleMode, listProducts } from "@/lib/catalog";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 80) : undefined;
  const products = await listProducts(query);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            {query ? `Results for “${query}”` : "New in"}
          </p>
          <h1 className="mt-2 max-w-2xl text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight sm:text-5xl">
            Everyday finds, <span className="text-[var(--color-accent)]">delivered.</span>
          </h1>
        </div>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">
          Home, pets, kids, tech and fashion. Bundle two or more items for up to 15% off.
        </p>
      </section>
      {isSampleMode() && (
        <p role="status" className="rounded-[var(--radius-control)] border-2 border-dashed border-[var(--color-warn)]/60 px-4 py-3 text-sm text-[var(--color-warn)]">
          Preview mode: showing sample products. Set RIZZOVA_API_URL to load the live catalogue.
        </p>
      )}
      <ProductGrid products={products} label={query ? `Search results for ${query}` : "Products"} />
    </div>
  );
}
