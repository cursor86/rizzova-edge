import { BrandFilm } from "@/components/editorial/brand-film";
import { ExploreTiles, tilesFrom } from "@/components/quiet/explore-tiles";
import { FreshFinds } from "@/components/quiet/fresh-finds";
import { DeliveryBand } from "@/components/quiet/delivery-band";
import { HowItWorks } from "@/components/quiet/how-it-works";
import { InsideTabs, type Shelf } from "@/components/quiet/inside-tabs";
import { PicksCarousel } from "@/components/quiet/picks-carousel";
import { HeroCollage } from "@/components/quiet/hero-collage";
import { ProductGrid } from "@/components/product-grid";
import { listProducts, previewSource } from "@/lib/catalog";
import type { Product } from "@/lib/types";

const withImage = (p: Product) => p.images.length > 0 && p.variants.some((v) => v.stock > 0);

function shelves(products: Product[], n: number): Shelf[] {
  const byCat = new Map<string, Product[]>();
  for (const p of products) if (p.category) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
  return [...byCat.entries()]
    .filter(([, list]) => list.length >= 4)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, n)
    .map(([name, list]) => ({ name, products: list }));
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
  // One product per category for the hero collage, so it shows the range.
  const seen = new Set<string>();
  const collage = shown.filter((p) => !/nee\s?doh/i.test(p.title) && !seen.has(p.category) && seen.add(p.category)).slice(0, 5);
  const picks = shown.filter((p) => !collage.includes(p)).slice(0, 3);
  const cats = shelves(shown, 5);

  return (
    <div className="-mb-24">
      {banner}
      <HeroCollage products={collage} />
      <ExploreTiles tiles={tilesFrom(shown)} />
      <FreshFinds products={shown.slice(3, 15)} />
      {picks.length > 0 && <PicksCarousel products={picks} section={1} />}
      <DeliveryBand section={2} />
      {cats.length > 0 && <InsideTabs shelves={cats} section={3} />}
      <HowItWorks section={4} />
      <BrandFilm />
      <section id="the-edit" aria-labelledby="edit-h" className="bg-[var(--color-ink)] py-24 text-[var(--color-fg)] sm:py-32">
        <div className="container-x space-y-10">
          <p className="border-b border-white/15 pb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">05 / Everything</p>
          <h2 id="edit-h" className="font-[family-name:var(--font-serif)] leading-none" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>The edit.</h2>
        </div>
        <div className="container-x mt-10 rounded-[var(--radius-panel)] bg-[var(--color-ink)] p-4 text-[var(--color-fg)] sm:p-6">
          <ProductGrid products={shown.slice(0, 24)} label="The edit" />
        </div>
      </section>
    </div>
  );
}
