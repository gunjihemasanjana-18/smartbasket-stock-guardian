import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";

import { calculateBill, validateQuantity } from "./billing";
import { uid } from "./format";
import { createSeedState } from "./sample-data";
import type { Bill, Customer, MovementReason, Product, StoreState } from "./types";

const STORAGE_KEY = "freshmart-store-v1";

type Action =
  | { type: "replace"; state: StoreState }
  | { type: "saveProduct"; product: Product; originalId?: string | undefined; movementId: string; date: string }
  | { type: "deleteProduct"; id: string }
  | { type: "adjustStock"; id: string; change: number; reason: MovementReason; movementId: string; date: string }
  | { type: "setCartQty"; id: string; qty: number }
  | { type: "clearCart" }
  | { type: "checkout"; bill: Bill };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "saveProduct": {
      const { product, originalId } = action;
      if (!originalId) {
        return {
          ...state,
          products: [...state.products, product],
          movements: [
            { id: action.movementId, productId: product.id, productName: product.name, change: product.stock, balance: product.stock, reason: "new", date: action.date },
            ...state.movements,
          ],
        };
      }
      const old = state.products.find((p) => p.id === originalId);
      const diff = old ? product.stock - old.stock : 0;
      return {
        ...state,
        products: state.products.map((p) => (p.id === originalId ? product : p)),
        cart: state.cart.map((c) => (c.productId === originalId ? { ...c, productId: product.id } : c)),
        movements: diff
          ? [{ id: action.movementId, productId: product.id, productName: product.name, change: diff, balance: product.stock, reason: "adjustment", date: action.date }, ...state.movements]
          : state.movements,
      };
    }
    case "deleteProduct":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
        cart: state.cart.filter((c) => c.productId !== action.id),
      };
    case "adjustStock": {
      const p = state.products.find((x) => x.id === action.id);
      if (!p) return state;
      const balance = Math.max(0, p.stock + action.change);
      return {
        ...state,
        products: state.products.map((x) => (x.id === action.id ? { ...x, stock: balance } : x)),
        movements: [
          { id: action.movementId, productId: p.id, productName: p.name, change: action.change, balance, reason: action.reason, date: action.date },
          ...state.movements,
        ],
      };
    }
    case "setCartQty": {
      if (action.qty <= 0) return { ...state, cart: state.cart.filter((c) => c.productId !== action.id) };
      const exists = state.cart.some((c) => c.productId === action.id);
      return {
        ...state,
        cart: exists
          ? state.cart.map((c) => (c.productId === action.id ? { ...c, qty: action.qty } : c))
          : [...state.cart, { productId: action.id, qty: action.qty }],
      };
    }
    case "clearCart":
      return { ...state, cart: [] };
    case "checkout": {
      const { bill } = action;
      const sold = new Map(bill.lines.map((l) => [l.productId, l.qty]));
      const products = state.products.map((p) => (sold.has(p.id) ? { ...p, stock: p.stock - sold.get(p.id)! } : p));
      const movements = bill.lines.map((l) => ({
        id: `${bill.id}-${l.productId}`,
        productId: l.productId,
        productName: l.name,
        change: -l.qty,
        balance: products.find((p) => p.id === l.productId)?.stock ?? 0,
        reason: "sale" as const,
        date: bill.date,
        ref: bill.number,
      }));
      return {
        ...state,
        products,
        bills: [bill, ...state.bills],
        movements: [...movements, ...state.movements],
        cart: [],
        nextBillNo: state.nextBillNo + 1,
      };
    }
  }
}

type CheckoutResult = { ok: true; bill: Bill } | { ok: false; error: string };

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createSeedState(new Date()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        if (Array.isArray(parsed?.products) && Array.isArray(parsed?.bills)) dispatch({ type: "replace", state: parsed });
      }
    } catch {
      /* ignore broken saved data and keep the sample data */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const productById = (id: string) => state.products.find((p) => p.id === id);
  const cartQty = (id: string) => state.cart.find((c) => c.productId === id)?.qty ?? 0;

  const cartLines = state.cart.flatMap((c) => {
    const p = productById(c.productId);
    return p ? [{ product: p, qty: c.qty, lineTotal: p.price * c.qty }] : [];
  });

  return {
    ...state,
    hydrated,
    cartLines,
    cartCount: state.cart.reduce((s, c) => s + c.qty, 0),
    productById,
    cartQty,

    saveProduct(product: Product, originalId?: string): string | null {
      const id = product.id.trim().toUpperCase();
      if (!id) return "Product ID is required.";
      if (state.products.some((p) => p.id === id && p.id !== originalId)) return `Product ID ${id} is already used.`;
      dispatch({ type: "saveProduct", product: { ...product, id }, originalId, movementId: uid(), date: new Date().toISOString() });
      return null;
    },
    deleteProduct(id: string) {
      dispatch({ type: "deleteProduct", id });
    },
    adjustStock(id: string, change: number, reason: MovementReason): string | null {
      const p = productById(id);
      if (!p) return "Product not found.";
      if (!Number.isInteger(change) || change === 0) return "Enter a whole quantity.";
      if (p.stock + change < 0) return `Only ${p.stock} ${p.unit} in stock.`;
      dispatch({ type: "adjustStock", id, change, reason, movementId: uid(), date: new Date().toISOString() });
      return null;
    },
    addToCart(id: string, qty: number): string | null {
      const p = productById(id);
      if (!p) return "Product not found.";
      const err = validateQuantity(p, qty, cartQty(id));
      if (err) return err;
      dispatch({ type: "setCartQty", id, qty: cartQty(id) + qty });
      return null;
    },
    setCartQty(id: string, qty: number): string | null {
      const p = productById(id);
      if (!p) return "Product not found.";
      if (qty <= 0) {
        dispatch({ type: "setCartQty", id, qty: 0 });
        return null;
      }
      const err = validateQuantity(p, qty, 0);
      if (err) return err;
      dispatch({ type: "setCartQty", id, qty });
      return null;
    },
    clearCart() {
      dispatch({ type: "clearCart" });
    },
    checkout(customer: Customer): CheckoutResult {
      if (!cartLines.length) return { ok: false, error: "Add products to the order first." };
      for (const l of cartLines) {
        const err = validateQuantity(l.product, l.qty, 0);
        if (err) return { ok: false, error: err };
      }
      const lines = cartLines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        unit: l.product.unit,
        price: l.product.price,
        qty: l.qty,
        lineTotal: l.lineTotal,
      }));
      const bill: Bill = {
        id: uid(),
        number: `INV-${state.nextBillNo}`,
        date: new Date().toISOString(),
        customer,
        lines,
        ...calculateBill(lines, customer.type),
      };
      dispatch({ type: "checkout", bill });
      return { ok: true, bill };
    },
    resetDemo() {
      dispatch({ type: "replace", state: createSeedState(new Date()) });
    },
  };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
