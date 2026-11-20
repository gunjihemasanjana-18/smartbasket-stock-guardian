import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/freshmart/format";
import { useStore } from "@/lib/freshmart/store";

export function CartList() {
  const { cartLines, setCartQty } = useStore();
  const change = (id: string, qty: number) => {
    const err = setCartQty(id, qty);
    if (err) toast.error(err);
  };
  return (
    <ul className="divide-y">
      {cartLines.map(({ product: p, qty, lineTotal }) => (
        <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xl">{p.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(p.price)} × {qty} = <span className="font-medium text-foreground">{formatCurrency(lineTotal)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-7" aria-label={`Less ${p.name}`} onClick={() => change(p.id, qty - 1)}>
              <Minus />
            </Button>
            <span className="w-7 text-center text-sm font-semibold">{qty}</span>
            <Button variant="outline" size="icon" className="size-7" aria-label={`More ${p.name}`} onClick={() => change(p.id, qty + 1)}>
              <Plus />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" aria-label={`Remove ${p.name}`} onClick={() => change(p.id, 0)}>
              <X />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
