import { Leaf } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/freshmart/format";
import type { Bill } from "@/lib/freshmart/types";

import { BillSummary } from "./BillSummary";

export function BillReceipt({ bill }: { bill: Bill }) {
  return (
    <div className="print-area space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none">FreshMart</p>
            <p className="text-xs text-muted-foreground">Tax invoice</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{bill.number}</p>
          <p className="text-muted-foreground">{formatDateTime(bill.date)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
        <div>
          <p className="font-medium">{bill.customer.name}</p>
          {bill.customer.phone && <p className="text-muted-foreground">{bill.customer.phone}</p>}
        </div>
        <Badge variant={bill.customer.type === "member" ? "member" : "outline"}>
          {bill.customer.type === "member" ? "Member" : "Regular"}
        </Badge>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((l) => (
            <tr key={l.productId} className="border-b border-dashed last:border-0">
              <td className="py-2">
                {l.name}
                <span className="block text-xs text-muted-foreground">{l.productId}</span>
              </td>
              <td className="py-2 text-right">
                {l.qty} {l.unit}
              </td>
              <td className="py-2 text-right">{formatCurrency(l.price)}</td>
              <td className="py-2 text-right font-medium">{formatCurrency(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <BillSummary totals={bill} />
      <p className="text-center text-xs text-muted-foreground">Thank you for shopping fresh with FreshMart!</p>
    </div>
  );
}
