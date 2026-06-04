"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductModerationItem } from "./product-moderation-item";
import { ProductModerationSkeleton } from "./product-moderation-skeleton";
import { ProductModerationEmpty } from "./product-moderation-empty";
import { Product } from "@/types/api";

interface ProductModerationListProps {
  products: Product[] | undefined;
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isActionPending: boolean;
}

export function ProductModerationList({
  products,
  isLoading,
  onApprove,
  onReject,
  isActionPending
}: ProductModerationListProps) {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Recent Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <ProductModerationSkeleton />
          ) : !products || products.length === 0 ? (
            <ProductModerationEmpty />
          ) : (
            products.map((product) => (
              <ProductModerationItem
                key={product.id}
                product={product}
                onApprove={onApprove}
                onReject={onReject}
                disabled={isActionPending}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
