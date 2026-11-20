import type { BillTotals, CustomerType, Product } from "./types";

/** PS 7 rules: discount on the subtotal first, then GST on the discounted amount. */
export const GST_RATE = 0.05;
export const DISCOUNT_RATES: Record<CustomerType, number> = {
  regular: 0.05,
  member: 0.1,
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateBill(
  lines: { price: number; qty: number }[],
  type: CustomerType,
): BillTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const discountRate = DISCOUNT_RATES[type];
  const discount = round2(subtotal * discountRate);
  const taxable = round2(subtotal - discount);
  const gst = round2(taxable * GST_RATE);
  const total = round2(taxable + gst);
  return { subtotal, discountRate, discount, taxable, gstRate: GST_RATE, gst, total };
}

/** Returns an error message when the quantity can't be taken from stock, otherwise null. */
export function validateQuantity(
  product: Pick<Product, "name" | "stock" | "unit">,
  qty: number,
  alreadyInCart = 0,
): string | null {
  if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
    return "Enter a whole quantity of at least 1.";
  }
  if (product.stock <= 0) return `${product.name} is out of stock.`;
  const available = product.stock - alreadyInCart;
  if (qty > available) {
    return available <= 0
      ? `All available ${product.name} is already in this order.`
      : `Only ${available} ${product.unit} of ${product.name} available.`;
  }
  return null;
}
