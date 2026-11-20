import { createFileRoute } from "@tanstack/react-router";
import { Eye, Search } from "lucide-react";
import { useState } from "react";

import { BillDialog } from "@/components/billing/BillDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/freshmart/format";
import { useStore } from "@/lib/freshmart/store";
import type { Bill } from "@/lib/freshmart/types";

export const Route = createFileRoute("/bills")({
  head: () => ({
    meta: [
      { title: "Previous Bills · FreshMart Grocery Manager" },
      { name: "description", content: "Full transaction history of every bill generated at FreshMart." },
      { property: "og:title", content: "FreshMart Previous Bills" },
      { property: "og:description", content: "Full transaction history of every bill generated at FreshMart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillsPage,
});

function BillsPage() {
  const { bills } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Bill | null>(null);
  const q = query.trim().toLowerCase();
  const rows = bills.filter((b) => !q || b.number.toLowerCase().includes(q) || b.customer.name.toLowerCase().includes(q) || b.customer.phone.includes(q));

  return (
    <>
      <PageHeader eyebrow="Module 5" title="Previous Bills" description="Every bill, newest first. Open one to see or print it." />
      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by bill number, customer or phone" className="pl-9" />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="🧾" title="No bills found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Bill</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-4 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{b.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(b.date)}</p>
                  </TableCell>
                  <TableCell>
                    <p>{b.customer.name}</p>
                    <Badge variant={b.customer.type === "member" ? "member" : "outline"}>{b.customer.type === "member" ? "Member" : "Regular"}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{b.lines.reduce((s, l) => s + l.qty, 0)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(b.total)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button variant="ghost" size="icon" aria-label={`View ${b.number}`} onClick={() => setOpen(b)}><Eye /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <BillDialog bill={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  );
}
