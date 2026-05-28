# Seller Dashboard Implementation Plan

This plan outlines the steps to complete the seller dashboard features, including adding new products, viewing recent orders, managing shipping status, and tracking earnings.

## 1. Backend API Enhancements

### Catalog Service
- [x] **Update Product Entity/DTO:** Ensure `sellerId` is handled during product creation.
- [x] **Create Product Route:** Modify `POST /catalog/products` to associate the product with the authenticated seller.
- [x] **Seller Products Route:** Add `GET /catalog/seller/products` to fetch products belonging to a specific seller.
- [x] **Product Status:** Ensure newly created products start with a `PENDING` status for admin approval.

### Order Service
- [x] **Seller Stats API:** Implement `GET /orders/seller/stats` to return:
    - Total Earnings (sum of `totalAmount` for `DELIVERED` or `PAID` orders).
    - Total Orders count.
    - Pending Orders count.
    - Recent activity.
- [x] **Order Management:** (Already partially implemented) Verify `PATCH /orders/seller/:id/status` works correctly for all valid transitions (PROCESSING -> SHIPPED -> DELIVERED).

### API Gateway
- [x] **Proxy New Routes:** Ensure the new routes in Catalog and Order services are accessible via the Gateway.

## 2. Frontend Implementation (Web App)

### Product Management
- [x] **Product List Page:** `apps/web/app/(dashboard)/dashboard/seller/products/page.tsx`
    - Table view of seller's products with status (Pending, Approved, Rejected).
- [x] **Add Product Form:** `apps/web/app/(dashboard)/dashboard/seller/products/new/page.tsx`
    - Form with fields: Name, Description, Price, Stock, Category, Images.
    - Integration with `catalog-service` via API Gateway.

### Dashboard & Analytics
- [x] **Real Stats Integration:** `apps/web/app/(dashboard)/dashboard/seller/page.tsx`
    - Replace mock cards with data from `GET /orders/seller/stats`.
- [x] **Recent Orders:** Ensure the dashboard's "Recent Orders" section uses real data.
- [x] **Earnings Chart:** Add a basic chart for daily/weekly earnings if time permits.

### Order & Shipping
- [x] **Order Status Management:** Ensure sellers can easily update order status from the order details page. (Check if existing logic needs refinement).

## 3. Implementation Checklist

- [x] Backend: Catalog Service updates (seller association)
- [x] Backend: Order Service updates (stats endpoint)
- [x] Backend: Gateway routing updates
- [x] Frontend: Product creation form
- [x] Frontend: Product listing page
- [x] Frontend: Dashboard stats integration
- [x] Verification: End-to-end test of adding a product and seeing it on the dashboard.
- [x] Verification: Placing an order and seeing earnings update (after status changes).
