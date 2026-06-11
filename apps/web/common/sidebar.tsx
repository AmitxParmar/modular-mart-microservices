import { ProductFilters } from "@/features/products/components/product-filters";

export default function Sidebar() {
    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 flex flex-col gap-12 pr-6">
                <ProductFilters />
            </div>
        </aside>
    );
}
