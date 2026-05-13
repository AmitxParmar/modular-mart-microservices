export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  sellerLists: () => [...orderKeys.all, 'seller-list'] as const,
  tracking: (id: string) => [...orderKeys.detail(id), 'tracking'] as const,
} as const;
