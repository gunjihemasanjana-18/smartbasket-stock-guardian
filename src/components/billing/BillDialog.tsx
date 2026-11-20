import { Printer } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { Bill } from "@/lib/freshmart/types";

import { BillReceipt } from "./BillReceipt";

export function BillDialog({
  bill,
  onOpenChange,
  extraAction,
}: {
  bill: Bill | null;
  onOpenChange: (open: boolean) => void;
  extraAction?: ReactNode;
}) {
  return (
    <Dialog open={!!bill} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="sr-only">Bill {bill?.number}</DialogTitle>
        {bill && <BillReceipt bill={bill} />}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print bill
          </Button>
          {extraAction}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
