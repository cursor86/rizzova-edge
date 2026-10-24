import { z } from "zod";

export const COUNTRIES = { AU: "Australia", US: "United States", AE: "United Arab Emirates" } as const;
export type CountryCode = keyof typeof COUNTRIES;

/** Postcode rules per country. The UAE has no postcodes, so it is optional there. */
const POSTCODE: Record<CountryCode, { test: (v: string) => boolean; message: string }> = {
  AU: { test: (v) => /^\d{4}$/.test(v), message: "Australian postcodes have 4 digits" },
  US: { test: (v) => /^\d{5}(-\d{4})?$/.test(v), message: "Enter a 5-digit ZIP code" },
  AE: { test: (v) => v === "" || /^[\w -]{2,10}$/.test(v), message: "Leave blank or enter a valid PO box" },
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
    country: z.enum(["AU", "US", "AE"], { message: "We deliver to Australia, the United States and the UAE" }),
  })
  .superRefine((d, ctx) => {
    const rule = POSTCODE[d.country];
    if (!rule.test(d.postalCode)) ctx.addIssue({ code: "custom", message: rule.message, path: ["postalCode"] });
  });

export const lineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  bundleId: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});

export const checkoutRequestSchema = z.object({
  contact: contactSchema,
  delivery: deliverySchema,
  lines: z.array(lineSchema).min(1, "Your cart is empty").max(50),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
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
