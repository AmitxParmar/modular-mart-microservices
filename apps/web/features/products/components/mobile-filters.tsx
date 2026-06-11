'use client';

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { ProductFilters } from './product-filters';
import { useFilterState } from '../hooks/use-filter-state';

export function MobileFilters() {
  const { filters } = useFilterState();
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== false).length;

  return (
    <div className="lg:hidden shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative h-9 gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>Product Filters</SheetTitle>
          </SheetHeader>
          <ProductFilters />
        </SheetContent>
      </Sheet>
    </div>
  );
}
