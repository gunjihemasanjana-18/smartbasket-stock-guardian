import { formatCurrency } from "@/lib/freshmart/format";
import type { BillTotals } from "@/lib/freshmart/types";

export function BillSummary({ totals }: { totals: BillTotals }) {
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
      <Row label={`Discount (${pct(totals.discountRate)})`} value={`− ${formatCurrency(totals.discount)}`} accent />
      <Row label="Amount after discount" value={formatCurrency(totals.taxable)} />
      <Row label={`GST (${pct(totals.gstRate)})`} value={`+ ${formatCurrency(totals.gst)}`} />
      <div className="mt-3 flex items-baseline justify-between border-t border-dashed pt-3">
        <dt className="font-display text-base font-semibold">Total payable</dt>
        <dd className="font-display text-2xl font-bold text-primary">{formatCurrency(totals.total)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-medium text-primary" : "font-medium"}>{value}</dd>
    </div>
  );
}
