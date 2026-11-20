import { round2 } from "./billing";
import { dayKey, dayLabel, startOfDayIST } from "./format";
import type { Bill, Product } from "./types";

export function salesSummary(bills: Bill[]) {
  const revenue = round2(bills.reduce((s, b) => s + b.total, 0));
  const itemsSold = bills.reduce((s, b) => s + b.lines.reduce((t, l) => t + l.qty, 0), 0);
  const discount = round2(bills.reduce((s, b) => s + b.discount, 0));
  const gst = round2(bills.reduce((s, b) => s + b.gst, 0));
  return {
    count: bills.length,
    revenue,
    itemsSold,
    discount,
    gst,
    average: bills.length ? round2(revenue / bills.length) : 0,
  };
}

export function topProducts(bills: Bill[], limit = 5) {
  const map = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
  for (const b of bills)
    for (const l of b.lines) {
      const e = map.get(l.productId) ?? { productId: l.productId, name: l.name, qty: 0, revenue: 0 };
      e.qty += l.qty;
      e.revenue = round2(e.revenue + l.lineTotal);
      map.set(l.productId, e);
    }
  return [...map.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, limit);
}

export function revenueByDay(bills: Bill[], days = 7, now = new Date()) {
  const start = startOfDayIST(now);
  const rows = Array.from({ length: days }, (_, i) => {
    const key = dayKey(new Date(start - (days - 1 - i) * 86_400_000 + 12 * 3_600_000));
    return { key, label: dayLabel(key), revenue: 0, bills: 0 };
  });
  const index = new Map(rows.map((r) => [r.key, r]));
  for (const b of bills) {
    const r = index.get(dayKey(b.date));
    if (r) {
      r.revenue = round2(r.revenue + b.total);
      r.bills += 1;
    }
  }
  return rows;
}

export function categorySales(bills: Bill[], products: Product[]) {
  const cat = new Map(products.map((p) => [p.id, p.category]));
  const map = new Map<string, number>();
  for (const b of bills)
    for (const l of b.lines) {
      const c = cat.get(l.productId) ?? "Other";
      map.set(c, round2((map.get(c) ?? 0) + l.lineTotal));
    }
  return [...map.entries()]
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function customerSplit(bills: Bill[]) {
  const out = { regular: { count: 0, revenue: 0 }, member: { count: 0, revenue: 0 } };
  for (const b of bills) {
    const e = out[b.customer.type];
    e.count += 1;
    e.revenue = round2(e.revenue + b.total);
  }
  return out;
}

export const billsToday = (bills: Bill[], now = new Date()) =>
  bills.filter((b) => dayKey(b.date) === dayKey(now));
