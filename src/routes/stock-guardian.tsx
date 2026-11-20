import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, Panel } from "@/components/common/Panel";
import { StockBadge } from "@/components/common/StockBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stockAlerts } from "@/lib/freshmart/stock-guardian";
import { useStore } from "@/lib/freshmart/store";

export const Route = createFileRoute("/stock-guardian")({
  head: () => ({
    meta: [
      { title: "Stock Guardian · FreshMart Grocery Manager" },
      { name: "description", content: "Find low-stock groceries and get restock suggestions based on recent sales." },
      { property: "og:title", content: "FreshMart Stock Guardian" },
      { property: "og:description", content: "Find low-stock groceries and get restock suggestions based on recent sales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockGuardianPage,
});

function StockGuardianPage() {
  const { products, bills, adjustStock } = useStore();
  const alerts = stockAlerts(products, bills);
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const qtyFor = (id: string, suggested: number) => Number(qtys[id] ?? suggested);

  function restock(id: string, name: string, qty: number) {
    const err = adjustStock(id, qty, "restock");
    if (err) return toast.error(err);
    toast.success(`Restocked ${qty} × ${name}`);
    setQtys((s) => { const n = { ...s }; delete n[id]; return n; });
  }

  function restockAll() {
    alerts.forEach((a) => adjustStock(a.product.id, qtyFor(a.product.id, a.suggestedQty), "restock"));
    toast.success(`Restocked ${alerts.length} products`);
    setQtys({});
  }

  return (
    <>
      <PageHeader
        eyebrow="Module 7"
        title="Smart Stock Guardian"
        description="Products at or below their reorder level, with a suggested order covering about two weeks of sales."
        actions={alerts.length > 0 && <Button onClick={restockAll}><PackageCheck /> Restock all suggested</Button>}
      />
      {alerts.length === 0 ? (
        <Panel><EmptyState icon={<ShieldCheck className="size-6" />} title="All stock is healthy">Nothing needs restocking right now.</EmptyState></Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map((a) => (
            <div key={a.product.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-12 place-items-center rounded-xl bg-muted text-2xl">{a.product.emoji}</span>
                <StockBadge product={a.product} />
              </div>
              <p className="mt-3 font-medium">{a.product.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">In stock</dt><dd className="font-semibold">{a.product.stock} {a.product.unit}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Reorder level</dt><dd className="font-semibold">{a.product.reorderLevel}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Sells per day</dt><dd className="font-semibold">{a.avgDaily.toFixed(1)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Runs out in</dt><dd className="font-semibold">{a.product.stock === 0 ? "Now" : a.daysLeft === null ? "—" : `${Math.floor(a.daysLeft)} days`}</dd></div>
              </dl>
              <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">Suggested restock: <strong>{a.suggestedQty} {a.product.unit}</strong></p>
              <div className="mt-auto flex gap-2 pt-3">
                <Input type="number" min={1} aria-label={`Restock quantity for ${a.product.name}`} value={qtys[a.product.id] ?? String(a.suggestedQty)} onChange={(e) => setQtys((s) => ({ ...s, [a.product.id]: e.target.value }))} className="w-24" />
                <Button className="flex-1" onClick={() => restock(a.product.id, a.product.name, qtyFor(a.product.id, a.suggestedQty))}>Restock</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
