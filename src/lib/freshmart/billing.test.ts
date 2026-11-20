import { describe, expect, it } from "vitest";

import { calculateBill, validateQuantity } from "./billing";

describe("PS 7 billing rules", () => {
  it("gives regular customers 5% off, then adds 5% GST on the discounted amount", () => {
    const t = calculateBill([{ price: 250, qty: 4 }], "regular");
    expect(t.subtotal).toBe(1000);
    expect(t.discount).toBe(50);
    expect(t.taxable).toBe(950);
    expect(t.gst).toBe(47.5);
    expect(t.total).toBe(997.5);
  });

  it("gives member customers 10% off, then adds 5% GST on the discounted amount", () => {
    const t = calculateBill([{ price: 250, qty: 4 }], "member");
    expect(t.discount).toBe(100);
    expect(t.gst).toBe(45);
    expect(t.total).toBe(945);
  });
});

describe("stock validation", () => {
  const milk = { name: "Milk", stock: 5, unit: "L" };

  it("rejects quantities above the stock still available", () => {
    expect(validateQuantity(milk, 3, 3)).toMatch(/Only 2/);
  });

  it("accepts quantities within available stock", () => {
    expect(validateQuantity(milk, 2, 3)).toBeNull();
  });

  it("rejects out-of-stock products", () => {
    expect(validateQuantity({ ...milk, stock: 0 }, 1)).toMatch(/out of stock/);
  });
});
