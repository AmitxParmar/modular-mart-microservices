import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct } from './api';
import { productKeys } from './keys';

/** Admin-only: create a new product. Invalidates the product list on success. */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate all product lists so consumers see the new product
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
