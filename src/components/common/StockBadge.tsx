import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, stockStatus } from "@/lib/freshmart/stock-guardian";
import type { Product } from "@/lib/freshmart/types";

const VARIANT = { out: "critical", critical: "critical", low: "warning", healthy: "success" } as const;

export function StockBadge({ product }: { product: Pick<Product, "stock" | "reorderLevel"> }) {
  const s = stockStatus(product);
  return <Badge variant={VARIANT[s]}>{STATUS_LABEL[s]}</Badge>;
}
