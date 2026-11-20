import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, IndianRupee, Receipt, ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { StatCard } from "@/components/common/StatCard";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { formatCurrency } from "@/lib/freshmart/format";
import { categorySales, customerSplit, revenueByDay, salesSummary, topProducts } from "@/lib/freshmart/reports";
import { useStore } from "@/lib/freshmart/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Sales Reports · FreshMart Grocery Manager" },
      { name: "description", content: "Total sales, revenue, popular products and category performance." },
      { property: "og:title", content: "FreshMart Sales Reports" },
      { property: "og:description", content: "Total sales, revenue, popular products and category performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { bills, products } = useStore();
  const s = salesSummary(bills);
  const top = topProducts(bills, 8);
  const cats = categorySales(bills, products);
  const split = customerSplit(bills);
  const maxCat = cats[0]?.revenue ?? 1;

  return (
    <>
      <PageHeader eyebrow="Module 6" title="Sales Reports" description="How the store is selling, from every bill saved." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatCurrency(s.revenue)} />
        <StatCard icon={Receipt} label="Total sales" value={s.count} hint={`Average ${formatCurrency(s.average)}`} tone="accent" />
        <StatCard icon={ShoppingBag} label="Items sold" value={s.itemsSold} />
        <StatCard icon={BadgePercent} label="Discounts · GST" value={formatCurrency(s.discount)} hint={`GST collected ${formatCurrency(s.gst)}`} tone="warning" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Revenue, last 14 days">
          <RevenueChart data={revenueByDay(bills, 14)} height={300} />
        </Panel>
        <Panel className="lg:col-span-2" title="Customer types">
          {(["regular", "member"] as const).map((t) => (
            <div key={t} className="mb-3 rounded-xl bg-muted p-4 last:mb-0">
              <p className="text-sm text-muted-foreground">{t === "member" ? "Members" : "Regular customers"}</p>
              <p className="font-display text-2xl font-bold">{formatCurrency(split[t].revenue)}</p>
              <p className="text-xs text-muted-foreground">{split[t].count} bills</p>
            </div>
          ))}
        </Panel>
        <Panel className="lg:col-span-3" title="Popular products">
          <ul className="divide-y">
            {top.map((p, i) => (
              <li key={p.productId} className="flex justify-between gap-3 py-2.5 text-sm">
                <span><span className="mr-2 text-muted-foreground">#{i + 1}</span>{p.name}</span>
                <span className="text-right"><span className="font-semibold">{p.qty} sold</span> · {formatCurrency(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="lg:col-span-2" title="Sales by category">
          <ul className="space-y-3">
            {cats.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex justify-between text-sm"><span>{c.category}</span><span className="font-medium">{formatCurrency(c.revenue)}</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(c.revenue / maxCat) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
