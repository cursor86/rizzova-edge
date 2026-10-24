/**
 * Store policy content. Plain-English drafts for the owner to review before launch; not legal advice.
 * Australian Consumer Law guarantees cannot be excluded, so the refund policy keeps them in full.
 */
export const STORE = {
  name: "Rizzova",
  abn: "77 403 370 861",
  email: "support@rizzova.com",
  phone: "+61 414 017 386",
  phoneHref: "+61414017386",
  updated: "24 October 2026",
} as const;

export interface PolicySection { heading: string; body: string[] }
export interface Policy { slug: string; title: string; intro: string; sections: PolicySection[] }

const ACL_STATEMENT =
  "Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage. You are also entitled to have the goods repaired or replaced if the goods fail to be of acceptable quality and the failure does not amount to a major failure.";

export const POLICIES: Policy[] = [
  {
    slug: "refunds",
    title: "Refunds & Returns",
    intro: "We want you to be happy with your order. Please read this before you buy.",
    sections: [
      { heading: "Change of mind", body: [
        "We do not offer refunds or returns for change of mind, for example if you no longer want an item, ordered the wrong size or colour, or found it cheaper elsewhere. Please check product details, sizes and photos carefully before ordering.",
        "This does not affect your rights under the Australian Consumer Law, explained below.",
      ] },
      { heading: "Faulty, damaged, wrong or not as described", body: [
        "If your item arrives faulty, damaged, is not what you ordered, or does not match its description, contact us at " + STORE.email + " with your order number and clear photos of the problem and the packaging.",
        "Please contact us as soon as you can after delivery. We will respond within 2 business days.",
        "For a major problem you can choose a refund or a replacement. For a minor problem we may choose to repair, replace or refund. We pay any return postage for faulty, damaged or incorrect items, and in many cases you will not need to send the item back.",
      ] },
      { heading: "Your rights under Australian law", body: [ACL_STATEMENT] },
      { heading: "Orders that do not arrive", body: [
        "If your tracking has not updated for 10 business days, or your order has not arrived 10 business days after the latest estimated delivery date, contact us. We will investigate with the courier and send a replacement or a full refund if the parcel is lost.",
      ] },
      { heading: "Cancellations", body: [
        "Orders are sent to our supplier quickly after payment. If you need to cancel, email us immediately. If the order has not yet been dispatched we will cancel it and refund you in full. Once dispatched, it cannot be cancelled.",
      ] },
      { heading: "How refunds are paid", body: [
        "Approved refunds go back to your original payment method. We process them within 5 business days of approval; your bank may take a few more days to show the credit.",
      ] },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery",
    intro: "We deliver to Australia and New Zealand.",
    sections: [
      { heading: "Delivery times", body: [
        "Items ship from our supplier's warehouses, mostly overseas. Estimated delivery is 10–20 business days to Australia and 12–25 business days to New Zealand after dispatch. These are estimates, not guarantees; holidays and customs can add time.",
        "Orders containing several items may arrive in separate parcels.",
      ] },
      { heading: "Shipping cost", body: ["Standard tracked shipping is shown at checkout before you pay."] },
      { heading: "Tracking", body: [
        "When your order is dispatched we email you a tracking number. Tracking can take a few days to show movement.",
      ] },
      { heading: "Address and customs", body: [
        "Please make sure your delivery address and phone number are correct; we are not responsible for delays caused by an incorrect address. Any import duties or taxes for your country are the receiver's responsibility.",
      ] },
    ],
  },
  {
    slug: "payments",
    title: "Payments",
    intro: "How payment works on Rizzova.",
    sections: [
      { heading: "Secure checkout", body: [
        "Payments are processed by Stripe. Your card details are entered on Stripe's secure payment page and are never seen or stored by Rizzova.",
        "You can pay by major credit and debit cards and by the wallets Stripe offers at checkout, such as Apple Pay or Google Pay where available.",
      ] },
      { heading: "Prices and GST", body: [
        "Prices are in Australian dollars (AUD). Rizzova is not registered for GST, so no GST is added to your order.",
      ] },
      { heading: "When you are charged", body: [
        "Your payment is taken when you place the order. If an item turns out to be unavailable after payment, we will tell you and refund that item in full.",
      ] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    intro: "This explains what personal information we collect and how we use it.",
    sections: [
      { heading: "What we collect", body: [
        "When you order: your name, email, phone number, delivery address and order details. Payment details are collected by Stripe, not by us.",
        "When you browse: basic technical information such as pages visited, collected to keep the site working and secure. Your cart is stored in your own browser.",
      ] },
      { heading: "How we use it", body: [
        "To process and deliver your order, send order and tracking emails, provide customer support, handle refunds, prevent fraud, and meet our legal and tax obligations.",
        "We do not sell your personal information.",
      ] },
      { heading: "Who we share it with", body: [
        "Only what is needed with: our supplier and couriers (name, address and phone, to deliver your order), Stripe (payment processing), and our hosting and email providers. Some of these providers are located outside Australia.",
      ] },
      { heading: "Keeping it safe", body: [
        "We use reputable providers with encrypted connections and limit access to your information. We keep order records for as long as needed for support, refunds and tax law.",
      ] },
      { heading: "Your choices", body: [
        "You can ask to see or correct the personal information we hold about you, or ask a question or make a complaint about privacy, by emailing " + STORE.email + ". We will respond within 30 days.",
      ] },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    intro: "These terms apply when you use rizzova.com and buy from us.",
    sections: [
      { heading: "About us", body: [
        `Rizzova is an Australian online store (ABN ${STORE.abn}). Contact: ${STORE.email}.`,
      ] },
      { heading: "Products and prices", body: [
        "We take care to describe products accurately; colours can look slightly different on different screens. Prices and availability can change without notice. If we list an item at an obviously wrong price, we may cancel the order and refund you in full.",
      ] },
      { heading: "Orders", body: [
        "An order is accepted when we send your order confirmation. We may decline or cancel an order, for example for suspected fraud or if an item is unavailable, and will refund you in full if we do.",
      ] },
      { heading: "Delivery, returns and refunds", body: [
        "Delivery is covered by our Shipping & Delivery page, and returns and refunds by our Refunds & Returns page. Both form part of these terms.",
      ] },
      { heading: "Consumer guarantees", body: [
        "Nothing in these terms excludes, restricts or modifies any right or remedy you have under the Australian Consumer Law or other laws that cannot be excluded. " + ACL_STATEMENT,
      ] },
      { heading: "Liability", body: [
        "To the extent permitted by law, and except for the guarantees above, we are not liable for indirect or consequential loss arising from the use of our website or products.",
      ] },
      { heading: "Governing law", body: ["These terms are governed by the laws of Victoria, Australia."] },
    ],
  },
];

export const policyBySlug = (slug: string): Policy | undefined => POLICIES.find((p) => p.slug === slug);
