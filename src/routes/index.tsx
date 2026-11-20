import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, IndianRupee, Package, Plus, Receipt, ShieldCheck, ShoppingBasket, TrendingUp } from "lucide-react";

import { EmptyState, Panel } from "@/components/common/Panel";
import { StatCard } from "@/components/common/StatCard";
import { StockBadge } from "@/components/common/StockBadge";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/freshmart/format";
import { billsToday, revenueByDay, salesSummary, topProducts } from "@/lib/freshmart/reports";
import { stockAlerts } from "@/lib/freshmart/stock-guardian";
import { useStore } from "@/lib/freshmart/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · FreshMart Grocery Manager" },
      { name: "description", content: "Today's sales, stock alerts and popular products at a glance for your FreshMart store." },
      { property: "og:title", content: "FreshMart Dashboard" },
      { property: "og:description", content: "Today's sales, stock alerts and popular products at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { products, bills } = useStore();
  const today = salesSummary(billsToday(bills));
  const all = salesSummary(bills);
  const alerts = stockAlerts(products, bills);
  const popular = topProducts(bills, 5);
  const week = revenueByDay(bills, 7);
  const maxQty = popular[0]?.qty ?? 1;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-elegant sm:p-10">
        <div className="pointer-events-none absolute -right-6 -bottom-10 select-none text-[9rem] leading-none opacity-25 sm:text-[12rem]" aria-hidden>
          🥬
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">FreshMart · SmartBasket</p>
        <h1 className="mt-2 max-w-xl font-display text-3xl font-bold sm:text-5xl">Intelligent Stock Guardian</h1>
        <p className="mt-3 max-w-lg text-primary-foreground/85">
          {alerts.length
            ? `${alerts.length} products need attention today. Keep shelves full and billing quick.`
            : "Every shelf is stocked. Keep billing quick and customers happy."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="hero" size="lg" asChild>
            <Link to="/orders">
              <ShoppingBasket /> New order
            </Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <Link to="/products">
              <Plus /> Add product
            </Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <Link to="/stock-guardian">
              <ShieldCheck /> Stock Guardian
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Today's revenue" value={formatCurrency(today.revenue)} hint={`${today.count} bills today`} />
        <StatCard icon={TrendingUp} label="Total revenue" value={formatCurrency(all.revenue)} hint={`${all.count} bills · ${all.itemsSold} items`} tone="accent" />
        <StatCard icon={Package} label="Products" value={products.length} hint={`${products.reduce((s, p) => s + p.stock, 0)} units in stock`} />
        <StatCard icon={AlertTriangle} label="Stock alerts" value={alerts.length} hint={`${alerts.filter((a) => a.status === "out").length} out of stock`} tone={alerts.length ? "danger" : "primary"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Sales summary"
          description="Revenue over the last 7 days"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">Full report</Link>
            </Button>
          }
        >
          <RevenueChart data={week} />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Stock alerts"
          description="Lowest stock first"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/stock-guardian">Restock</Link>
            </Button>
          }
        >
          {alerts.length === 0 ? (
            <EmptyState icon="✅" title="All stock healthy" />
          ) : (
            <ul className="space-y-3">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.product.id} className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted text-xl">{a.product.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.product.stock} {a.product.unit} left · reorder at {a.product.reorderLevel}
                    </p>
                  </div>
                  <StockBadge product={a.product} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent bills"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bills">View all</Link>
            </Button>
          }
        >
          {bills.length === 0 ? (
            <EmptyState icon={<Receipt className="size-6" />} title="No bills yet" />
          ) : (
            <ul className="divide-y">
              {bills.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.number} · {b.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(b.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.customer.type === "member" && <Badge variant="member">Member</Badge>}
                    <span className="text-sm font-semibold">{formatCurrency(b.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Popular products" description="By units sold">
          {popular.length === 0 ? (
            <EmptyState icon="🛒" title="No sales yet" />
          ) : (
            <ul className="space-y-4">
              {popular.map((p, i) => (
                <li key={p.productId}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">
                      <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-muted-foreground">{p.qty} sold</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
