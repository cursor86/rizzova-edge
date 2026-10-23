/**
 * Checkout funnel telemetry: step reached, step completed, validation failures by field name, outcome.
 * Never includes what the shopper typed. Events go to window.dataLayer when an analytics tag is installed
 * and are also dispatched as a DOM event ("rizzova:telemetry") for any listener.
 */
export type TelemetryEvent =
  | { name: "checkout_step_view"; step: string }
  | { name: "checkout_step_complete"; step: string; ms: number }
  | { name: "checkout_validation_error"; step: string; fields: string[] }
  | { name: "checkout_submit"; lines: number; valueCents: number }
  | { name: "checkout_result"; outcome: "redirect" | "preview" | "error"; code?: string };

declare global {
  interface Window { dataLayer?: Record<string, unknown>[] }
}

export function track(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer?.push({ event: event.name, ...event });
    window.dispatchEvent(new CustomEvent<TelemetryEvent>("rizzova:telemetry", { detail: event }));
  } catch {
    /* telemetry must never break checkout */
  }
}
