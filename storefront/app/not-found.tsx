import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass mx-auto mt-10 max-w-lg rounded-[var(--radius-panel)] p-8 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">We couldn&apos;t find that page</h1>
      <Link href="/" className="btn-brutal mt-6 inline-flex h-11 items-center px-5">Back to shop</Link>
    </div>
  );
}
