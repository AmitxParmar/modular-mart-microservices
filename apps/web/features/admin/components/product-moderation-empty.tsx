import { Package } from "lucide-react";

export function ProductModerationEmpty() {
  return (
    <div 
      className="text-center py-12 border-2 border-dashed border-border/40 rounded-xl"
      role="status"
      aria-live="polite"
    >
      <Package className="size-12 text-muted-foreground/20 mx-auto mb-4" aria-hidden="true" />
      <p className="text-muted-foreground">No products found for review.</p>
    </div>
  );
}
