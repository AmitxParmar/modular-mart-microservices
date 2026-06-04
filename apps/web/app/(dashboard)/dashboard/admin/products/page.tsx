"use client";

import { useState, useCallback } from "react";
import { useAdminProducts, useApproveProduct, useRejectProduct } from "@/features/admin/queries";
import { ProductModerationHeader } from "@/features/admin/components/product-moderation-header";
import { ProductModerationList } from "@/features/admin/components/product-moderation-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { mutate: approve, isPending: isApproving } = useApproveProduct();
  const { mutate: reject, isPending: isRejecting } = useRejectProduct();

  const [actionItem, setActionItem] = useState<{ id: string, type: "approve" | "reject" } | null>(null);

  const handleApproveClick = useCallback((id: string) => {
    setActionItem({ id, type: "approve" });
  }, []);

  const handleRejectClick = useCallback((id: string) => {
    setActionItem({ id, type: "reject" });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!actionItem) return;
    
    if (actionItem.type === "approve") {
      approve(actionItem.id, {
        onSettled: () => setActionItem(null)
      });
    } else {
      reject(actionItem.id, {
        onSettled: () => setActionItem(null)
      });
    }
  }, [actionItem, approve, reject]);

  const isPending = isApproving || isRejecting;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProductModerationHeader 
        title="Product Moderation"
        description="Review, approve, or reject seller product listings."
      />

      <ProductModerationList 
        products={products}
        isLoading={isLoading}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        isActionPending={isPending}
      />

      <Dialog open={!!actionItem} onOpenChange={(open) => !open && setActionItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionItem?.type === "approve" ? "Approve Product" : "Reject Product"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionItem?.type === "approve" ? "approve" : "reject"} this product? 
              This action can be changed later, but will immediately affect the product's visibility.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>
              Cancel
            </DialogClose>
            <Button 
              variant={actionItem?.type === "approve" ? "default" : "destructive"} 
              onClick={handleConfirmAction}
              disabled={isPending}
            >
              {isPending ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
