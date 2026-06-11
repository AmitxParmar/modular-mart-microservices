'use client';

import { useCategories, useProducts } from '../queries';
import { useFilterState } from '../hooks/use-filter-state';
import { Input } from '@/components/ui/input';
import { Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

export function ProductFilters() {
  const { filters, setFilter, clearFilters } = useFilterState();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: productsData } = useProducts(filters);
  
  const [brandSearch, setBrandSearch] = useState('');

  const aggregations = productsData?.pages[0]?.metadata?.aggregations;
  const brandAggs = aggregations?.brands || {};
  
  // Extract other attributes from aggregations
  const otherAggs = useMemo(() => {
    const { brands, ...rest } = aggregations || {};
    return rest;
  }, [aggregations]);

  const handleCategoryChange = (slug: string) => {
    setFilter('categorySlug', filters.categorySlug === slug ? undefined : slug);
  };

  const handlePriceChange = (min?: number, max?: number) => {
    setFilter('minPrice', min);
    setFilter('maxPrice', max);
  };

  const filteredBrands = useMemo(() => {
    return Object.entries(brandAggs)
      .filter(([brand]) => brand.toLowerCase().includes(brandSearch.toLowerCase()))
      .sort((a, b) => b[1] - a[1]);
  }, [brandAggs, brandSearch]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== false).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear All
            <X className="ml-2 size-3" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground font-bold">Categories</h3>
        <div className="space-y-2">
          {isLoadingCategories ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-muted rounded w-3/4" />
              ))}
            </div>
          ) : (
            categories?.map((category) => (
              <label 
                key={category.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={cn(
                  "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
                  filters.categorySlug === category.slug && "border-primary bg-primary/10"
                )}>
                  <Input 
                    type="checkbox" 
                    className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                    checked={filters.categorySlug === category.slug}
                    onChange={() => handleCategoryChange(category.slug)}
                  />
                  <Check className={cn(
                    "size-3 text-primary transition-opacity",
                    filters.categorySlug === category.slug ? "opacity-100" : "opacity-0"
                  )} />
                </div>
                <span className={cn(
                  "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
                  filters.categorySlug === category.slug && "text-foreground font-medium"
                )}>
                  {category.name}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground font-bold">Brands</h3>
        
        {Object.keys(brandAggs).length > 5 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              className="pl-8 h-8 text-xs"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
          {filteredBrands.length > 0 ? (
            filteredBrands.map(([brand, count]) => (
              <label 
                key={brand}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
                    filters.brand === brand && "border-primary bg-primary/10"
                  )}>
                    <Input 
                      type="checkbox" 
                      className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                      checked={filters.brand === brand}
                      onChange={() => setFilter('brand', filters.brand === brand ? undefined : brand)}
                    />
                    <Check className={cn(
                      "size-3 text-primary transition-opacity",
                      filters.brand === brand ? "opacity-100" : "opacity-0"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
                    filters.brand === brand && "text-foreground font-medium"
                  )}>
                    {brand}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2">No brands found.</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground font-bold">Price Range</h3>
        <div className="space-y-3">
          {[
            { label: 'Under $50', min: undefined, max: 50 },
            { label: '$50 - $100', min: 50, max: 100 },
            { label: '$100 - $500', min: 100, max: 500 },
            { label: 'Over $500', min: 500, max: undefined },
          ].map((range) => {
            const isSelected = filters.minPrice === range.min && filters.maxPrice === range.max;
            return (
              <label 
                key={range.label}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={cn(
                  "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
                  isSelected && "border-primary bg-primary/10"
                )}>
                  <Input 
                    type="checkbox" 
                    className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                    checked={isSelected}
                    onChange={() => handlePriceChange(range.min, range.max)}
                  />
                  <Check className={cn(
                    "size-3 text-primary transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0"
                  )} />
                </div>
                <span className={cn(
                  "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
                  isSelected && "text-foreground font-medium"
                )}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Ratings */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground font-bold">Minimum Rating</h3>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <label 
              key={rating}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={cn(
                "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
                filters.rating === rating && "border-primary bg-primary/10"
              )}>
                <Input 
                  type="checkbox" 
                  className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                  checked={filters.rating === rating}
                  onChange={() => setFilter('rating', filters.rating === rating ? undefined : rating)}
                />
                <Check className={cn(
                  "size-3 text-primary transition-opacity",
                  filters.rating === rating ? "opacity-100" : "opacity-0"
                )} />
              </div>
              <span className={cn(
                "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
                filters.rating === rating && "text-foreground font-medium"
              )}>
                {rating}+ Stars
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dynamic Attributes */}
      {Object.entries(otherAggs).map(([name, values]) => (
        <div key={name} className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground font-bold">{name}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
            {Object.entries(values as Record<string, number>).map(([value, count]) => (
              <label 
                key={value}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
                    filters[name] === value && "border-primary bg-primary/10"
                  )}>
                    <Input 
                      type="checkbox" 
                      className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                      checked={filters[name] === value}
                      onChange={() => setFilter(name, filters[name] === value ? undefined : value)}
                    />
                    <Check className={cn(
                      "size-3 text-primary transition-opacity",
                      filters[name] === value ? "opacity-100" : "opacity-0"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
                    filters[name] === value && "text-foreground font-medium"
                  )}>
                    {value}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Availability */}
      <div className="space-y-4 pt-4 border-t">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={cn(
            "relative flex items-center justify-center size-5 border border-border rounded transition-colors group-hover:border-primary",
            filters.inStock && "border-primary bg-primary/10"
          )}>
            <Input 
              type="checkbox" 
              className="absolute opacity-0 w-full h-full cursor-pointer peer" 
              checked={filters.inStock}
              onChange={() => setFilter('inStock', !filters.inStock)}
            />
            <Check className={cn(
              "size-3 text-primary transition-opacity",
              filters.inStock ? "opacity-100" : "opacity-0"
            )} />
          </div>
          <span className={cn(
            "text-sm text-muted-foreground transition-colors group-hover:text-foreground",
            filters.inStock && "text-foreground font-medium"
          )}>
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );
}
