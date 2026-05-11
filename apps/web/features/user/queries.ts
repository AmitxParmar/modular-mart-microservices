import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress,
  fetchUserOrders 
} from './api';
import { userKeys } from './keys';

export function useAddresses() {
  return useQuery({
    queryKey: userKeys.addresses(),
    queryFn: fetchAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, address }: { id: string; address: any }) => updateAddress(id, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
}

export function useUserOrders() {
  return useQuery({
    queryKey: userKeys.orders(),
    queryFn: fetchUserOrders,
  });
}
