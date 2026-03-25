/**
 * Centralised API endpoint constants.
 * Change the base paths here when the gateway prefix changes.
 */
export const ENDPOINTS = {
  // User Service
  ME: '/users/me',

  // Catalog Service
  PRODUCTS: '/catalog/products',
  PRODUCT: (slug: string) => `/catalog/products/${slug}`,
  CATEGORIES: '/catalog/categories',

  // Orders Service
  ORDERS: '/orders',
  ORDER: (id: string) => `/orders/${id}`,

  // Payments Service
  STRIPE_WEBHOOK: '/payments/stripe-webhook',
} as const;
