import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import type { Job } from "./jobs";
import { handleCron, handleQueue } from "./jobs";
import { oauth } from "./routes/oauth";
import { admin } from "./routes/admin";
import { products } from "./routes/products";
import { cart } from "./routes/cart";
import { checkout } from "./routes/checkout";
import { stripeWebhook } from "./routes/stripe";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", async (c, next) => cors({ origin: c.env.PUBLIC_SITE_URL, credentials: true })(c, next));
app.get("/", (c) => c.json({ service: "rizzova-edge", ok: true }));
app.route("/oauth", oauth);
app.route("/admin", admin);
app.route("/api/products", products);
app.route("/api/cart", cart);
app.route("/api/checkout", checkout);
app.route("/webhooks/stripe", stripeWebhook);
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

export default {
  fetch: app.fetch,
  queue: (batch: MessageBatch<Job>, env: Env) => handleQueue(batch, env),
  scheduled: (controller: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(handleCron(controller, env)),
} satisfies ExportedHandler<Env, Job>;
