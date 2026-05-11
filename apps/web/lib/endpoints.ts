/**
 * Centralised API endpoint constants.
 * Change the base paths here when the gateway prefix changes.
 */
export const ENDPOINTS = {
  // User Service
  ME: '/users/me',
  ADDRESSES: '/users/me/addresses',
  ADDRESS: (id: string) => `/users/me/addresses/${id}`,
  ADDRESS_DEFAULT: (id: string) => `/users/me/addresses/${id}/default`,

  // Catalog Service
  PRODUCTS: '/catalog/products',
  PRODUCT: (slug: string) => `/catalog/products/${slug}`,
  CATEGORIES: '/catalog/categories',
  
  // Admin Product Management
  ADMIN_PRODUCTS: '/catalog/admin/products',
  ADMIN_PRODUCT_APPROVE: (id: string) => `/catalog/admin/products/${id}/approve`,
  ADMIN_PRODUCT_REJECT: (id: string) => `/catalog/admin/products/${id}/reject`,

  // Orders Service
  ORDERS: '/orders',
  CREATE_ORDER: '/orders',
  ORDER: (id: string) => `/orders/${id}`,
  USER_ORDERS: '/users/me/orders',

  // Admin Platform Management
  ADMIN_STATS: '/catalog/admin/stats',
  ADMIN_HEALTH: '/catalog/admin/health',
  ADMIN_ANALYTICS: '/catalog/admin/analytics',
  ADMIN_USERS: '/users/admin/users',


  // Payments Service
  CREATE_INTENT: '/payments/create-intent',
  STRIPE_WEBHOOK: '/payments/stripe-webhook',
} as const;

