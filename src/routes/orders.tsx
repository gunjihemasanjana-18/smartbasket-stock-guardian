import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Search, ShoppingBasket, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CartList } from "@/components/billing/CartList";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/freshmart/format";
import { stockStatus } from "@/lib/freshmart/stock-guardian";
import { useStore } from "@/lib/freshmart/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Customer Orders · FreshMart Grocery Manager" },
      { name: "description", content: "Pick grocery products, enter quantities and check stock before billing." },
      { property: "og:title", content: "FreshMart Customer Orders" },
      { property: "og:description", content: "Pick products, enter quantities and check stock before billing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { products, cartLines, cartQty, addToCart, clearCart } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const q = query.trim().toLowerCase();
  const list = products.filter(
    (p) => (category === "All" || p.category === category) && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
  );
  const subtotal = cartLines.reduce((s, l) => s + l.lineTotal, 0);

  function add(id: string, name: string) {
    const qty = Number(qtys[id] ?? "1");
    const err = addToCart(id, qty);
    setErrors((e) => ({ ...e, [id]: err ?? "" }));
    if (err) toast.error(err);
    else {
      toast.success(`Added ${qty} × ${name}`);
      setQtys((s) => ({ ...s, [id]: "1" }));
    }
  }

  return (
    <>
      <PageHeader eyebrow="Module 2" title="Customer Orders" description="Choose products and quantities. Stock is checked before anything is added." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="bg-card pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  c === category ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => {
              const available = p.stock - cartQty(p.id);
              const out = stockStatus(p) === "out";
              return (
                <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-muted text-2xl">{p.emoji}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                  </div>
                  <p className="mt-3 font-medium leading-snug">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(p.price)} / {p.unit}
                  </p>
                  <p className={cn("mt-1 text-xs font-medium", out ? "text-destructive" : available <= p.reorderLevel ? "text-warning-foreground" : "text-primary")}>
                    {out ? "Out of stock" : `${available} available`}
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      aria-label={`Quantity of ${p.name}`}
                      value={qtys[p.id] ?? "1"}
                      onChange={(e) => setQtys((s) => ({ ...s, [p.id]: e.target.value }))}
                      className="w-20"
                      disabled={out}
                    />
                    <Button className="flex-1" onClick={() => add(p.id, p.name)} disabled={out}>
                      <Plus /> Add
                    </Button>
                  </div>
                  {errors[p.id] && <p className="mt-2 text-xs text-destructive">{errors[p.id]}</p>}
                </div>
              );
            })}
          </div>
          {list.length === 0 && <EmptyState icon="🔍" title="No products match" />}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Panel
            title="Current order"
            description={`${cartLines.length} products`}
            action={
              cartLines.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 /> Clear
                </Button>
              )
            }
          >
            {cartLines.length === 0 ? (
              <EmptyState icon={<ShoppingBasket className="size-6" />} title="Basket is empty">
                Add products from the list to start an order.
              </EmptyState>
            ) : (
              <div className="space-y-4">
                <CartList />
                <div className="flex justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-display text-lg font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link to="/billing">
                    Proceed to billing <ArrowRight />
                  </Link>
                </Button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
