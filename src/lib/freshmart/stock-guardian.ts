import type { Bill, Product } from "./types";

export type StockStatus = "out" | "critical" | "low" | "healthy";

export const STATUS_LABEL: Record<StockStatus, string> = {
  out: "Out of stock",
  critical: "Critical",
  low: "Low stock",
  healthy: "In stock",
};

const SEVERITY: Record<StockStatus, number> = { out: 0, critical: 1, low: 2, healthy: 3 };

export function stockStatus(p: Pick<Product, "stock" | "reorderLevel">): StockStatus {
  if (p.stock <= 0) return "out";
  if (p.stock <= Math.ceil(p.reorderLevel / 2)) return "critical";
  if (p.stock <= p.reorderLevel) return "low";
  return "healthy";
}

export function averageDailySales(productId: string, bills: Bill[], days = 7, now = new Date()) {
  const from = now.getTime() - days * 86_400_000;
  let qty = 0;
  for (const b of bills) {
    if (new Date(b.date).getTime() < from) continue;
    for (const l of b.lines) if (l.productId === productId) qty += l.qty;
  }
  return qty / days;
}

export interface RestockAdvice {
  product: Product;
  status: StockStatus;
  avgDaily: number;
  daysLeft: number | null;
  suggestedQty: number;
}

/** Target two weeks of demand, and never less than twice the reorder level. */
export function adviseRestock(product: Product, bills: Bill[], now = new Date()): RestockAdvice {
  const status = stockStatus(product);
  const avgDaily = averageDailySales(product.id, bills, 7, now);
  const daysLeft = avgDaily > 0 ? product.stock / avgDaily : null;
  const target = Math.max(product.reorderLevel * 2, Math.ceil(avgDaily * 14));
  const raw = Math.max(0, target - product.stock);
  const suggestedQty = status === "healthy" ? 0 : Math.max(5, Math.ceil(raw / 5) * 5);
  return { product, status, avgDaily, daysLeft, suggestedQty };
}

export function stockAlerts(products: Product[], bills: Bill[], now = new Date()) {
  return products
    .map((p) => adviseRestock(p, bills, now))
    .filter((a) => a.status !== "healthy")
    .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.product.stock - b.product.stock);
}
