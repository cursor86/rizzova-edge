import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaGallery, type MediaItem } from "@/components/pdp/media-gallery";
import { ProductExperience } from "@/components/pdp/product-experience";
import { SpecPanel } from "@/components/pdp/spec-panel";
import { getComplements, getProduct } from "@/lib/catalog";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.title, description: product.description ?? undefined } : { title: "Not found" };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const complements = await getComplements(product);
  const media: MediaItem[] = product.images.map((src, i) => ({ kind: "image", src, alt: `${product.title}, image ${i + 1}` }));
  const prices = product.variants.map((v) => v.priceCents / 100);

  // Structured data so search engines and AI shopping agents can read price and stock without scraping the UI.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    sku: product.variants[0]?.sku,
    image: product.images,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.currency,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" aria-labelledby="product-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="min-w-0 space-y-6">
        <MediaGallery media={media} title={product.title} seed={product.id} category={product.category} isSample={product.isSample} />
        <SpecPanel specs={product.specs} />
      </div>
      <div className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
        <header>
          {product.isSample && (
            <p className="mb-2 inline-block rounded-[var(--radius-chip)] border border-[var(--color-warn)]/60 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-warn)]">
              Sample product, not for sale
            </p>
          )}
          <h1 id="product-title" className="text-balance font-[family-name:var(--font-display)] text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>
          {product.description && (
            product.isSample
              ? <p className="mt-3 text-[var(--color-muted)]">{product.description}</p>
              // Supplier HTML is sanitised by the ingestion Worker before it reaches D1.
              : <div className="prose-invert mt-3 max-w-none text-[var(--color-muted)]" dangerouslySetInnerHTML={{ __html: product.description }} />
          )}
        </header>
        <ProductExperience product={product} complements={complements} />
      </div>
    </article>
  );
}
