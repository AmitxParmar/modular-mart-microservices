"use client";

import { useFilterState } from "../hooks/use-filter-state";
import { Button } from "@/components/ui/button";
import { X, ArrowDownWideNarrow } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileFilters } from "./mobile-filters";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Highest Rated", value: "rating_desc" },
  { label: "Best Selling", value: "best_selling" },
];

export function FilterToolbar() {
  const { filters, setFilter, clearFilters } = useFilterState();

  const activeChips = [
    filters.categorySlug && {
      label: `Category: ${filters.categorySlug}`,
      name: "categorySlug",
    },
    filters.brand && { label: `Brand: ${filters.brand}`, name: "brand" },
    filters.minPrice && {
      label: `Min: $${filters.minPrice}`,
      name: "minPrice",
    },
    filters.maxPrice && {
      label: `Max: $${filters.maxPrice}`,
      name: "maxPrice",
    },
    filters.rating && { label: `${filters.rating}+ Stars`, name: "rating" },
    filters.inStock && { label: "In Stock", name: "inStock" },
    filters.search && { label: `Search: ${filters.search}`, name: "search" },
  ].filter(Boolean) as { label: string; name: any }[];

  const currentSort =
    SORT_OPTIONS.find((opt) => opt.value === filters.sort) || SORT_OPTIONS[0];

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <MobileFilters />

          <div className="flex flex-wrap gap-2 overflow-hidden">
            {activeChips.map((chip) => (
              <Badge
                key={chip.label}
                variant="secondary"
                className="pl-3 pr-1 py-1 h-7 text-xs flex items-center gap-1 whitespace-nowrap"
              >
                {chip.label}
                <button
                  onClick={() => setFilter(chip.name, undefined)}
                  className="hover:bg-muted rounded-full p-0.5 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <ArrowDownWideNarrow className="size-4" />
                  <span className="hidden sm:inline">Sort by:</span>{" "}
                  {currentSort?.label}
                </Button>
              }
            />

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={filters.sort || "featured"}
                onValueChange={(v) => setFilter("sort", v)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
