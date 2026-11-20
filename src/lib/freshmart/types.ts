export type CustomerType = "regular" | "member";

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  reorderLevel: number;
  emoji: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface BillLine {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface Customer {
  name: string;
  phone: string;
  type: CustomerType;
}

export interface BillTotals {
  subtotal: number;
  discountRate: number;
  discount: number;
  taxable: number;
  gstRate: number;
  gst: number;
  total: number;
}

export interface Bill extends BillTotals {
  id: string;
  number: string;
  date: string;
  customer: Customer;
  lines: BillLine[];
}

export type MovementReason = "sale" | "restock" | "adjustment" | "new";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  change: number;
  balance: number;
  reason: MovementReason;
  date: string;
  ref?: string;
}

export interface StoreState {
  products: Product[];
  bills: Bill[];
  movements: StockMovement[];
  cart: CartLine[];
  nextBillNo: number;
}
