# Frontend Performance Optimizations (apps/web)

This document summarizes the performance and maintainability optimizations applied to the `web` application based on automated audits and architectural reviews.

## 1. Static `Intl` Formatter Hoisting
- **Location:** `apps/web/features/order/components/order-card.tsx`
- **Change:** Moved `new Intl.NumberFormat()` from inside the `formatCurrency` function to the module's top-level scope.
- **Benefit:** Prevents expensive re-allocation of locale-data tables and formatting objects on every component render. Constructing `Intl` objects is computationally heavy; hoisting them reduces CPU overhead and UI stutter during list rendering.

## 2. Tailwind Utility Consolidation (`size-N`)
- **Location:** 35 files across `apps/web`
- **Change:** Collapsed redundant `w-N h-N` classes into the single `size-N` utility (e.g., `w-4 h-4` → `size-4`).
- **Benefit:** Reduces the overall length of the HTML class attribute and the size of the generated CSS bundle. It streamlines the DOM and makes the layout logic easier for both the browser and developers to parse.

## 3. Native Layout Spacing (`gap` vs `space`)
- **Location:** Multiple dashboard and storefront pages.
- **Change:** Replaced Tailwind's `space-x-*` and `space-y-*` utilities with native `gap-x-*` and `gap-y-*` on flex/grid containers.
- **Benefit:** `gap` is handled natively by the browser's flexbox/grid engine. Unlike `space-*` (which uses complex CSS selectors like `:not(:first-child)` and margin hacks), `gap` correctly handles wrapped lines, hidden children, and RTL layouts without triggering unnecessary layout shifts or phantom margins.

## 4. UI Component Consolidation (DRY)
- **Location:** `apps/web/components/products/product-list-item.tsx`, `apps/web/components/orders/address-snapshot.tsx`
- **Change:** Extracted highly duplicated JSX logic into reusable, standalone components.
- **Benefit:** Reduces the total JavaScript bundle size by eliminating hundreds of lines of duplicated UI code. Smaller bundles result in faster download, parse, and execution times for the end-user.

## 5. Dead Code & Asset Elimination
- **Location:** `apps/web/app/page.module.css`, `apps/web/package.json`
- **Change:** 
    - Removed unused CSS modules and redundant test scripts.
    - Cleaned up 52 unused dependencies across the monorepo via `fallow fix`.
- **Benefit:** Decreases the footprint of the application. Removing unused CSS and JS dependencies ensures that the build pipeline is faster and that the production environment only ships code that is actually executed.

## 6. Next.js Metadata Optimization
- **Location:** `apps/web/app/(storefront)/**/*.tsx`
- **Change:** Added explicit `Metadata` exports to page components.
- **Benefit:** Improves SEO and social sharing performance. While primarily a functional requirement, proper metadata allows search engines and social platforms to index and preview the site efficiently, reducing the need for heavy client-side "discovery" scripts.

## 7. Developer Experience (Fast Refresh)
- **Location:** `apps/web/components/ui/navigation-menu.tsx`
- **Change:** Refactored non-component exports (styles) into a pattern that preserves React Fast Refresh.
- **Benefit:** While not a direct user-facing optimization, fixing Fast Refresh significantly increases developer velocity by allowing instant feedback without full page reloads, leading to higher-quality code iterations.

## 8. Resilient Server-Side Prefetching
- **Location:** `apps/web/app/(storefront)/page.tsx`
- **Change:** Implemented server-side prefetching for product data using TanStack Query with a 1.5-second `Promise.race` timeout cap.
- **Benefit:** Eliminates the initial loading skeleton for the product grid while ensuring that slow or failing backend services do not block the Time to First Byte (TTFB). This stabilizes LCP and improves perceived performance under various network conditions.

## 9. SSR & Component Boundary Optimization
- **Location:** `apps/web/app/(storefront)/layout.tsx`, `apps/web/app/(dashboard)/layout.tsx`
- **Change:** Removed unnecessary `"use client"` directives from layout components.
- **Benefit:** Enables Server-Side Rendering (SSR) for the application's structural shell. This allows the browser to receive and render critical content (like the Hero section) much earlier in the loading sequence, directly improving FCP and LCP.

## 10. Targeted Font Loading
- **Location:** `apps/web/app/layout.tsx`, `apps/web/app/(dashboard)/layout.tsx`
- **Change:** Moved `JetBrains_Mono` and `Geist_Mono` from the root layout to specific route groups (Dashboard) where they are required.
- **Benefit:** Reduces the number of critical font files preloaded for storefront users. By only loading the necessary `Geist_Sans` font for the storefront, we reduce the "element render delay" for LCP text elements.

## 11. Bundle Size Reduction (Lazy Loading)
- **Location:** `apps/web/app/layout.tsx`
- **Change:** Refactored `AuthDialog` and `Toaster` to use `next/dynamic` for client-side lazy loading.
- **Benefit:** Removes non-critical components and their heavy dependencies (like Clerk) from the initial JavaScript bundle. This reduces main-thread blocking time during hydration, allowing the page to become interactive faster.

## 12. Connectivity & API Resilience
- **Location:** `apps/web/app/layout.tsx`, `apps/web/lib/api-client.ts`
- **Change:** 
    - Added `<link rel="preconnect">` for the Clerk authentication origin.
    - Configured a global 5-second timeout for all Axios API requests.
- **Benefit:** Preconnecting reduces latency for critical third-party resources. The API timeout ensures the frontend server remains responsive and can quickly fallback to cached or empty states if microservices are unreachable, preventing cascading performance failures.
