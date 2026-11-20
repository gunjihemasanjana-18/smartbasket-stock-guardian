import { createFileRoute } from "@tanstack/react-router";
import { Boxes, IndianRupee, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { StatCard } from "@/components/common/StatCard";
import { StockBadge } from "@/components/common/StockBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/freshmart/format";
import { stockAlerts } from "@/lib/freshmart/stock-guardian";
import { useStore } from "@/lib/freshmart/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · FreshMart Grocery Manager" },
      { name: "description", content: "Stock levels update automatically after every purchase; adjust stock by hand." },
      { property: "og:title", content: "FreshMart Inventory" },
      { property: "og:description", content: "Stock levels update automatically after every purchase; adjust stock by hand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});

const REASON = { sale: "Sale", restock: "Restock", adjustment: "Adjustment", new: "New product" } as const;

function InventoryPage() {
  const { products, bills, movements, adjustStock } = useStore();
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const units = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);

  function adjust(id: string, sign: 1 | -1) {
    const qty = Number(qtys[id] ?? "");
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("Enter a whole quantity first.");
    const err = adjustStock(id, sign * qty, sign > 0 ? "restock" : "adjustment");
    if (err) return toast.error(err);
    toast.success(sign > 0 ? `Added ${qty} to stock` : `Removed ${qty} from stock`);
    setQtys((s) => ({ ...s, [id]: "" }));
  }

  return (
    <>
      <PageHeader eyebrow="Module 4" title="Inventory Management" description="Stock goes down automatically with every bill. Add or remove stock by hand here." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Boxes} label="Units in stock" value={units} />
        <StatCard icon={IndianRupee} label="Stock value" value={formatCurrency(value)} tone="accent" />
        <StatCard icon={Boxes} label="Need restocking" value={stockAlerts(products, bills).length} tone="warning" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Stock level</TableHead>
                <TableHead className="pr-4 text-right">Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{p.emoji} {p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id}</p>
                  </TableCell>
                  <TableCell className="min-w-40">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{p.stock} {p.unit}</span>
                      <StockBadge product={p} />
                    </div>
                    <Progress value={Math.min(100, (p.stock / Math.max(1, p.reorderLevel * 3)) * 100)} className="h-1.5" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Input type="number" min={1} aria-label={`Quantity for ${p.name}`} value={qtys[p.id] ?? ""} onChange={(e) => setQtys((s) => ({ ...s, [p.id]: e.target.value }))} className="h-8 w-16" placeholder="Qty" />
                      <Button size="icon" className="size-8" aria-label={`Add stock for ${p.name}`} onClick={() => adjust(p.id, 1)}><Plus /></Button>
                      <Button size="icon" variant="outline" className="size-8" aria-label={`Remove stock for ${p.name}`} onClick={() => adjust(p.id, -1)}><Minus /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Panel title="Stock movements" description="Latest changes">
          <ul className="space-y-3">
            {movements.slice(0, 15).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.productName}</p>
                  <p className="text-xs text-muted-foreground">{REASON[m.reason]}{m.ref ? ` · ${m.ref}` : ""} · {formatDateTime(m.date)}</p>
                </div>
                <span className={cn("font-semibold", m.change < 0 ? "text-destructive" : "text-primary")}>{m.change > 0 ? `+${m.change}` : m.change}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
