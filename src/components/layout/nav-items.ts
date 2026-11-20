import {
  BarChart3,
  History,
  LayoutDashboard,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingBasket,
  Warehouse,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Customer Orders", icon: ShoppingBasket },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/inventory", label: "Inventory", icon: Warehouse },
  { to: "/bills", label: "Previous Bills", icon: History },
  { to: "/reports", label: "Sales Reports", icon: BarChart3 },
  { to: "/stock-guardian", label: "Stock Guardian", icon: ShieldCheck },
] as const;
