import { calculateBill } from "./billing";
import { startOfDayIST } from "./format";
import type { Bill, CustomerType, Product, StockMovement, StoreState } from "./types";

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "FM001", name: "Basmati Rice 1 kg", category: "Grains & Staples", unit: "kg", price: 120, stock: 45, reorderLevel: 15, emoji: "🍚" },
  { id: "FM002", name: "Whole Wheat Atta 5 kg", category: "Grains & Staples", unit: "pack", price: 265, stock: 22, reorderLevel: 10, emoji: "🌾" },
  { id: "FM003", name: "Toor Dal 1 kg", category: "Pulses", unit: "kg", price: 160, stock: 8, reorderLevel: 12, emoji: "🫘" },
  { id: "FM004", name: "Full Cream Milk 1 L", category: "Dairy & Eggs", unit: "L", price: 68, stock: 6, reorderLevel: 20, emoji: "🥛" },
  { id: "FM005", name: "Farm Eggs (12)", category: "Dairy & Eggs", unit: "tray", price: 84, stock: 0, reorderLevel: 10, emoji: "🥚" },
  { id: "FM006", name: "Fresh Paneer 200 g", category: "Dairy & Eggs", unit: "pack", price: 90, stock: 14, reorderLevel: 8, emoji: "🧀" },
  { id: "FM007", name: "Bananas (dozen)", category: "Fruits", unit: "dozen", price: 60, stock: 30, reorderLevel: 10, emoji: "🍌" },
  { id: "FM008", name: "Red Apples 1 kg", category: "Fruits", unit: "kg", price: 180, stock: 18, reorderLevel: 8, emoji: "🍎" },
  { id: "FM009", name: "Tomatoes 1 kg", category: "Vegetables", unit: "kg", price: 40, stock: 4, reorderLevel: 15, emoji: "🍅" },
  { id: "FM010", name: "Onions 1 kg", category: "Vegetables", unit: "kg", price: 35, stock: 50, reorderLevel: 20, emoji: "🧅" },
  { id: "FM011", name: "Potatoes 1 kg", category: "Vegetables", unit: "kg", price: 30, stock: 60, reorderLevel: 20, emoji: "🥔" },
  { id: "FM012", name: "Carrots 500 g", category: "Vegetables", unit: "pack", price: 32, stock: 25, reorderLevel: 10, emoji: "🥕" },
  { id: "FM013", name: "Brown Bread", category: "Bakery", unit: "loaf", price: 50, stock: 5, reorderLevel: 10, emoji: "🍞" },
  { id: "FM014", name: "Butter 100 g", category: "Dairy & Eggs", unit: "pack", price: 58, stock: 20, reorderLevel: 8, emoji: "🧈" },
  { id: "FM015", name: "Sunflower Oil 1 L", category: "Oils & Spices", unit: "L", price: 155, stock: 28, reorderLevel: 10, emoji: "🌻" },
  { id: "FM016", name: "Green Tea (25 bags)", category: "Beverages", unit: "box", price: 145, stock: 16, reorderLevel: 6, emoji: "🍵" },
  { id: "FM017", name: "Instant Coffee 100 g", category: "Beverages", unit: "jar", price: 320, stock: 5, reorderLevel: 5, emoji: "☕" },
  { id: "FM018", name: "Orange Juice 1 L", category: "Beverages", unit: "L", price: 110, stock: 12, reorderLevel: 6, emoji: "🧃" },
  { id: "FM019", name: "Dark Chocolate", category: "Snacks", unit: "bar", price: 99, stock: 35, reorderLevel: 10, emoji: "🍫" },
  { id: "FM020", name: "Salted Peanuts 200 g", category: "Snacks", unit: "pack", price: 45, stock: 40, reorderLevel: 10, emoji: "🥜" },
];

type SeedOrder = [daysAgo: number, hour: number, name: string, phone: string, type: CustomerType, lines: [string, number][]];

const SEED_ORDERS: SeedOrder[] = [
  [6, 10, "Ananya Rao", "9876543210", "member", [["FM001", 2], ["FM004", 3], ["FM007", 1]]],
  [6, 17, "Rahul Verma", "9811122233", "regular", [["FM010", 2], ["FM011", 3], ["FM009", 2]]],
  [5, 11, "Priya Nair", "9845098450", "member", [["FM006", 2], ["FM014", 1], ["FM013", 2], ["FM004", 2]]],
  [5, 19, "Walk-in Customer", "", "regular", [["FM019", 3], ["FM018", 1]]],
  [4, 9, "Karthik S", "9900112233", "regular", [["FM002", 1], ["FM003", 1], ["FM015", 1]]],
  [4, 18, "Meera Iyer", "9988776655", "member", [["FM008", 2], ["FM007", 2], ["FM005", 1]]],
  [3, 12, "Ananya Rao", "9876543210", "member", [["FM004", 4], ["FM005", 2], ["FM013", 1]]],
  [3, 20, "Vikram Singh", "9123456780", "regular", [["FM017", 1], ["FM016", 1], ["FM020", 2]]],
  [2, 10, "Priya Nair", "9845098450", "member", [["FM009", 3], ["FM010", 2], ["FM012", 2], ["FM011", 2]]],
  [2, 16, "Sneha Das", "9830012345", "regular", [["FM001", 3], ["FM003", 2], ["FM015", 1]]],
  [1, 11, "Meera Iyer", "9988776655", "member", [["FM004", 3], ["FM006", 1], ["FM014", 2], ["FM005", 1]]],
  [1, 18, "Rahul Verma", "9811122233", "regular", [["FM019", 2], ["FM007", 1], ["FM018", 2]]],
  [0, 8, "Karthik S", "9900112233", "regular", [["FM004", 2], ["FM013", 1], ["FM009", 2]]],
  [0, 9, "Sneha Das", "9830012345", "member", [["FM008", 1], ["FM016", 1], ["FM001", 1]]],
];

export function createSeedState(now = new Date()): StoreState {
  const products = SAMPLE_PRODUCTS.map((p) => ({ ...p }));
  const byId = new Map(products.map((p) => [p.id, p]));
  const dayStart = startOfDayIST(now);
  const orders = SEED_ORDERS.map((o) => ({
    o,
    date: new Date(dayStart - o[0] * 86_400_000 + o[1] * 3_600_000),
  })).filter((x) => x.date.getTime() <= now.getTime());

  // Work out the opening stock so that the sample sales end at the listed stock levels.
  const balance = new Map(products.map((p) => [p.id, p.stock]));
  for (const { o } of orders) for (const [id, q] of o[5]) balance.set(id, (balance.get(id) ?? 0) + q);

  const bills: Bill[] = [];
  const movements: StockMovement[] = [];
  let no = 1001;
  for (const { o, date } of orders) {
    const [, , name, phone, type, rawLines] = o;
    const lines = rawLines.map(([id, qty]) => {
      const p = byId.get(id)!;
      return { productId: id, name: p.name, unit: p.unit, price: p.price, qty, lineTotal: p.price * qty };
    });
    const number = `INV-${no++}`;
    const iso = date.toISOString();
    bills.push({ id: `seed-${number}`, number, date: iso, customer: { name, phone, type }, lines, ...calculateBill(lines, type) });
    for (const l of lines) {
      const b = (balance.get(l.productId) ?? 0) - l.qty;
      balance.set(l.productId, b);
      movements.push({ id: `seed-${number}-${l.productId}`, productId: l.productId, productName: l.name, change: -l.qty, balance: b, reason: "sale", date: iso, ref: number });
    }
  }

  return {
    products,
    bills: bills.reverse(),
    movements: movements.reverse(),
    cart: [],
    nextBillNo: no,
  };
}
