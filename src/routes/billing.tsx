import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, Crown, Receipt, ShoppingBasket, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BillDialog } from "@/components/billing/BillDialog";
import { BillSummary } from "@/components/billing/BillSummary";
import { CartList } from "@/components/billing/CartList";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateBill, DISCOUNT_RATES, GST_RATE } from "@/lib/freshmart/billing";
import { useStore } from "@/lib/freshmart/store";
import type { Bill, CustomerType } from "@/lib/freshmart/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing · FreshMart Grocery Manager" },
      { name: "description", content: "Generate bills with regular and member discounts plus 5% GST." },
      { property: "og:title", content: "FreshMart Billing System" },
      { property: "og:description", content: "Generate bills with regular and member discounts plus 5% GST." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

const TYPES: { type: CustomerType; label: string; icon: typeof User }[] = [
  { type: "regular", label: "Regular customer", icon: User },
  { type: "member", label: "Member customer", icon: Crown },
];

function BillingPage() {
  const { cartLines, checkout } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<CustomerType>("regular");
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);

  const totals = calculateBill(cartLines.map((l) => ({ price: l.product.price, qty: l.qty })), type);

  function generate() {
    setError(null);
    const cleanPhone = phone.replace(/\D/g, "");
    if (type === "member" && !name.trim()) return setError("Enter the member's name.");
    if (type === "member" && !cleanPhone) return setError("Enter the member's phone number.");
    if (cleanPhone && cleanPhone.length !== 10) return setError("Phone number must have 10 digits.");
    const res = checkout({ name: name.trim() || "Walk-in Customer", phone: cleanPhone, type });
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(`Bill ${res.bill.number} generated · stock updated`);
    setBill(res.bill);
    setName("");
    setPhone("");
    setType("regular");
  }

  return (
    <>
      <PageHeader
        eyebrow="Module 3"
        title="Billing System"
        description={`Regular customers get ${DISCOUNT_RATES.regular * 100}% off, members get ${DISCOUNT_RATES.member * 100}% off. ${GST_RATE * 100}% GST is added on the discounted amount.`}
      />

      {cartLines.length === 0 ? (
        <Panel>
          <EmptyState icon={<ShoppingBasket className="size-6" />} title="No products in this order">
            <p>Pick products in Customer Orders, then come back here to bill.</p>
            <Button className="mt-4" asChild>
              <Link to="/orders">Go to Customer Orders</Link>
            </Button>
          </EmptyState>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Panel title="Customer">
              <div className="grid gap-3 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setType(t.type)}
                    aria-pressed={type === t.type}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                      type === t.type ? "border-primary bg-secondary" : "border-border hover:bg-muted",
                    )}
                  >
                    <span className={cn("grid size-10 place-items-center rounded-lg", type === t.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <t.icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-medium">{t.label}</span>
                      <span className="flex items-center gap-1 text-sm text-primary">
                        <BadgePercent className="size-3.5" /> {DISCOUNT_RATES[t.type] * 100}% discount
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cname">Customer name {type === "regular" && <span className="text-muted-foreground">(optional)</span>}</Label>
                  <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Walk-in Customer" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cphone">Phone {type === "regular" && <span className="text-muted-foreground">(optional)</span>}</Label>
                  <Input id="cphone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
                </div>
              </div>
            </Panel>

            <Panel title="Order items" description="Change quantities if needed">
              <CartList />
            </Panel>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <Panel title="Bill summary">
              <BillSummary totals={totals} />
              {error && <p className="mt-4 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button size="lg" className="mt-5 w-full" onClick={generate}>
                <Receipt /> Generate bill
              </Button>
              <Button variant="soft" className="mt-2 w-full" asChild>
                <Link to="/orders">Add more products</Link>
              </Button>
            </Panel>
          </div>
        </div>
      )}

      <BillDialog
        bill={bill}
        onOpenChange={(o) => !o && setBill(null)}
        extraAction={
          <Button asChild>
            <Link to="/orders">Start new order</Link>
          </Button>
        }
      />
    </>
  );
}
