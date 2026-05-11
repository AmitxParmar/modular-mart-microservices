import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAdminStats, 
  fetchServiceHealth, 
  fetchAdminUsers, 
  fetchAdminProducts,
  approveProduct,
  rejectProduct
} from './api';
import { adminKeys } from './keys';

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: fetchAdminStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useServiceHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: fetchServiceHealth,
    refetchInterval: 1000 * 30, // Every 30 seconds
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: fetchAdminUsers,
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: adminKeys.products(),
    queryFn: fetchAdminProducts,
  });
}

export function useApproveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}

export function useRejectProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
    },
  });
}
