import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/policy-page";
import { POLICIES, policyBySlug } from "@/lib/policies";

type Params = Promise<{ policy: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return POLICIES.map((p) => ({ policy: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = policyBySlug((await params).policy);
  return { title: p?.title ?? "Not found" };
}

export default async function Page({ params }: { params: Params }) {
  const policy = policyBySlug((await params).policy);
  if (!policy) notFound();
  return <PolicyPage policy={policy} />;
}
