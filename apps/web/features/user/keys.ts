export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  addresses: () => [...userKeys.all, 'addresses'] as const,
  address: (id: string) => [...userKeys.addresses(), id] as const,
  orders: () => [...userKeys.all, 'orders'] as const,
} as const;
