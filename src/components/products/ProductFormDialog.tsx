import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/freshmart/store";
import type { Product } from "@/lib/freshmart/types";

type Form = Record<"id" | "name" | "category" | "unit" | "price" | "stock" | "reorderLevel" | "emoji", string>;

function nextId(products: Product[]) {
  const max = products.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, "")) || 0), 0);
  return `FM${String(max + 1).padStart(3, "0")}`;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}) {
  const { products, saveProduct } = useStore();
  const [form, setForm] = useState<Form>({} as Form);
  const [error, setError] = useState<string | null>(null);
  const categories = [...new Set(products.map((p) => p.category))].sort();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      product
        ? {
            id: product.id,
            name: product.name,
            category: product.category,
            unit: product.unit,
            price: String(product.price),
            stock: String(product.stock),
            reorderLevel: String(product.reorderLevel),
            emoji: product.emoji,
          }
        : { id: nextId(products), name: "", category: "", unit: "pcs", price: "", stock: "", reorderLevel: "10", emoji: "🛒" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const reorderLevel = Number(form.reorderLevel);
    if (!form.name.trim()) return setError("Enter a product name.");
    if (!form.category.trim()) return setError("Enter a category.");
    if (!(price > 0)) return setError("Price must be more than ₹0.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number, 0 or more.");
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) return setError("Reorder level must be a whole number.");
    const err = saveProduct(
      {
        id: form.id,
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit.trim() || "pcs",
        price: Math.round(price * 100) / 100,
        stock,
        reorderLevel,
        emoji: form.emoji.trim() || "🛒",
      },
      product?.id,
    );
    if (err) return setError(err);
    toast.success(product ? `${form.name} updated` : `${form.name} added to products`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{product ? "Edit product" : "Add a new product"}</DialogTitle>
          <DialogDescription>Product ID, price and stock are used across orders and billing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Field label="Product ID" id="pid">
            <Input id="pid" value={form.id ?? ""} onChange={set("id")} />
          </Field>
          <Field label="Icon (emoji)" id="pemoji">
            <Input id="pemoji" value={form.emoji ?? ""} onChange={set("emoji")} maxLength={4} />
          </Field>
          <Field label="Product name" id="pname" wide>
            <Input id="pname" value={form.name ?? ""} onChange={set("name")} placeholder="e.g. Green Peas 500 g" />
          </Field>
          <Field label="Category" id="pcat">
            <Input id="pcat" list="categories" value={form.category ?? ""} onChange={set("category")} />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Unit" id="punit">
            <Input id="punit" value={form.unit ?? ""} onChange={set("unit")} placeholder="kg, pack, L" />
          </Field>
          <Field label="Price (₹)" id="pprice">
            <Input id="pprice" type="number" min="0" step="0.01" value={form.price ?? ""} onChange={set("price")} />
          </Field>
          <Field label="Stock quantity" id="pstock">
            <Input id="pstock" type="number" min="0" step="1" value={form.stock ?? ""} onChange={set("stock")} />
          </Field>
          <Field label="Reorder level" id="preorder" wide>
            <Input id="preorder" type="number" min="0" step="1" value={form.reorderLevel ?? ""} onChange={set("reorderLevel")} />
            <p className="text-xs text-muted-foreground">Stock Guardian warns you when stock falls to this level.</p>
          </Field>
          {error && <p className="col-span-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{product ? "Save changes" : "Add product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, wide, children }: { label: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "col-span-2 space-y-1.5" : "col-span-2 space-y-1.5 sm:col-span-1"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
