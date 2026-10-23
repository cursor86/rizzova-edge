import { z } from "zod";

export const COUNTRIES = { AU: "Australia", NZ: "New Zealand" } as const;
export type CountryCode = keyof typeof COUNTRIES;

/** Delivery routing per destination. Times are estimates; the tracking email confirms the real date. */
export const SHIPPING_ROUTES: Record<CountryCode, { method: string; estimate: string; priceCents: number }> = {
  AU: { method: "Tracked standard", estimate: "Estimated 10–20 business days", priceCents: 0 },
  NZ: { method: "Tracked standard", estimate: "Estimated 12–25 business days", priceCents: 0 },
};

export const contactSchema = z.object({
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{8,20}$/, "Enter a phone number for the courier"),
});

export const deliverySchema = z
  .object({
    name: z.string().trim().min(2, "Enter the recipient's full name").max(120),
    line1: z.string().trim().min(3, "Enter a street address").max(120),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2, "Enter a suburb or city").max(80),
    state: z.string().trim().min(2, "Enter a state or region").max(80),
    postalCode: z.string().trim(),
    country: z.enum(["AU", "NZ"], { message: "We deliver to Australia and New Zealand" }),
  })
  .refine((d) => /^\d{4}$/.test(d.postalCode), { message: "Postcodes have 4 digits", path: ["postalCode"] });

export const lineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  bundleId: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});

export const checkoutRequestSchema = z.object({
  contact: contactSchema,
  delivery: deliverySchema,
  lines: z.array(lineSchema).min(1, "Your cart is empty").max(50),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export type CheckoutResponse =
  | { ok: true; mode: "live"; orderNumber: string; checkoutUrl: string }
  | { ok: true; mode: "preview"; orderNumber: string; message: string }
  | { ok: false; code: "invalid" | "stock" | "payment_unavailable" | "upstream" | "forbidden"; message: string; problems?: { variantId: number; reason: string }[] };

/** Flattens Zod issues to { field: firstMessage } for inline errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
