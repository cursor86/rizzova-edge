const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency: string): string {
  const key = currency.toUpperCase();
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-AU", { style: "currency", currency: key });
    formatters.set(key, f);
  }
  return f.format(cents / 100);
}

export const LOW_STOCK_THRESHOLD = 5;

export function stockState(stock: number): "in_stock" | "low" | "out" {
  if (stock <= 0) return "out";
  return stock <= LOW_STOCK_THRESHOLD ? "low" : "in_stock";
}
