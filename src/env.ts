import type { Job } from "./jobs";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JOBS: Queue<Job>;

  AE_GATEWAY: string;
  AE_SHIP_TO_COUNTRY: string;
  STORE_CURRENCY: string;
  STORE_LANGUAGE: string;
  PRICE_MARKUP: string;
  COMPARE_AT_MARKUP: string;
  PUBLIC_SITE_URL: string;
  CF_IMAGES_ACCOUNT_HASH: string;
  CHECKOUT_COUNTRIES: string;
  AUTO_FULFIL: string;

  // Secrets
  AE_APP_KEY: string;
  AE_APP_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CF_ACCOUNT_ID: string;
  CF_IMAGES_API_TOKEN: string;
  ADMIN_TOKEN: string;
}
