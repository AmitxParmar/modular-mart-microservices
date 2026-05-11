export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  health: () => [...adminKeys.all, 'health'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  products: () => [...adminKeys.all, 'products'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
} as const;
