export const sellerKeys = {
  all: ['seller'] as const,
  products: () => [...sellerKeys.all, 'products'] as const,
  stats: () => [...sellerKeys.all, 'stats'] as const,
  orders: () => ['orders', 'seller-list'] as const,
} as const;
