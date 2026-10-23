import type { CSSProperties } from "react";

const HUES = [32, 165, 280, 12, 200, 95, 330, 50];

interface Props {
  src?: string;
  alt: string;
  seed: number;
  label: string;
  aspect: string;
  isSample?: boolean;
  className?: string;
}

/** Product media, or a generated tile when a (sample) product has no photo yet. */
export function ProductArt({ src, alt, seed, label, aspect, isSample = false, className = "" }: Props) {
  const hue = HUES[seed % HUES.length] ?? 32;
  const style: CSSProperties = { aspectRatio: aspect };
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudflare Images already serves sized variants
        <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="grid size-full place-items-center"
          style={{
            background: `radial-gradient(120% 90% at 20% 15%, hsl(${hue} 85% 62% / 0.55), transparent 60%),
                         radial-gradient(90% 80% at 85% 90%, hsl(${(hue + 60) % 360} 70% 45% / 0.45), transparent 60%),
                         #15171d`,
          }}
        >
          <span className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.2em] text-white/70">{label}</span>
        </div>
      )}
      {isSample && (
        <span className="absolute left-3 top-3 rounded-[var(--radius-chip)] border border-white/25 bg-black/50 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">
          Sample
        </span>
      )}
    </div>
  );
}
