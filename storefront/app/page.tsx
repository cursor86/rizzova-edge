import { BrandFilm } from "@/components/editorial/brand-film";
import { Collage } from "@/components/editorial/collage";
import { EditorialHero } from "@/components/editorial/editorial-hero";
import { Marquee } from "@/components/editorial/marquee";
import { SplitFeature, type CategoryFeature } from "@/components/editorial/split-feature";
import { Spotlight } from "@/components/editorial/spotlight";
import { ProductGrid } from "@/components/product-grid";
import { listProducts, previewSource } from "@/lib/catalog";
import type { Product } from "@/lib/types";

const withImage = (p: Product) => p.images.length > 0 && p.variants.some((v) => v.stock > 0);

function topCategories(products: Product[], n: number): CategoryFeature[] {
  const byCat = new Map<string, Product[]>();
  for (const p of products) if (p.category) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
  return [...byCat.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, n)
    .flatMap(([name, list]) => (list[0] ? [{ name, count: list.length, cover: list[0] }] : []));
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 80) : undefined;
  const [products, source] = await Promise.all([listProducts(query), previewSource()]);

  const banner = source && (
    <p role="status" className="container-x pt-4">
      <span className="block rounded-[var(--radius-control)] border-2 border-dashed border-[var(--color-warn)]/60 px-4 py-2.5 text-sm text-[var(--color-warn)]">
        {source === "rizzova.com"
          ? "Preview: products shown from the current rizzova.com catalogue. Checkout here is a demo and takes no payment."
          : "Preview: sample products. Checkout here is a demo and takes no payment."}
      </span>
    </p>
  );

  if (query) {
    return (
      <>
        {banner}
        <div className="container-x space-y-8 pt-10">
          <h1 className="font-[family-name:var(--font-poster)] text-5xl uppercase sm:text-7xl">“{query}”</h1>
          <ProductGrid products={products} label={`Search results for ${query}`} />
        </div>
      </>
    );
  }

  const shown = products.filter(withImage);
  const [featured, centre, ...rest] = shown;
  const categories = topCategories(shown, 2);
  const categoryCount = new Set(shown.map((p) => p.category).filter(Boolean)).size;
  const spotlight = rest.find((p) => /flask|tumbler|bottle|bag|lamp/i.test(p.title)) ?? rest[6];
  const ribbon = [...topCategories(shown, 5).map((c) => c.name), "Bundle & save up to 15%"];

  return (
    <>
      {banner}
      {featured && <EditorialHero featured={featured} productCount={shown.length} categoryCount={categoryCount} />}
      <Marquee items={ribbon} tone="accent" tilt={-2} />
      <BrandFilm />
      {centre && <Collage centre={centre} satellites={rest.slice(0, 6)} />}
      <Marquee items={["Kitchen", "Play", "Sleep", "Travel", "Pets", "Gifts"]} tone="ink" tilt={1.5} durationSeconds={36} />
      {spotlight && <Spotlight product={spotlight} index={1} />}
      {categories.length === 2 && <SplitFeature features={categories} />}
      <section id="the-edit" aria-labelledby="edit-h" className="container-x scroll-mt-24 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <h2 id="edit-h" className="font-[family-name:var(--font-poster)] text-6xl uppercase leading-none sm:text-8xl">The edit</h2>
          <p className="max-w-xs font-[family-name:var(--font-serif)] text-xl italic text-[var(--color-muted)]">Hand-picked, restocked often, bundled for less.</p>
        </div>
        <ProductGrid products={shown.slice(0, 24)} label="The edit" />
      </section>
    </>
  );
}
