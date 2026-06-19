import { ProductFilters } from "@/features/products/components/product-filters";
import { Suspense } from "react";

export default function Sidebar() {
    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 flex flex-col gap-12 pr-6">
                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted rounded-xl" />}>
                    <ProductFilters />
                </Suspense>
            </div>
        </aside>
    );
}
