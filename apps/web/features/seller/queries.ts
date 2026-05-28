import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchSellerProducts, fetchSellerStats, fetchSellerOrders } from "./api";
import { sellerKeys } from "./keys";

/** Returns all products belonging to the active seller. */
export function useSellerProducts() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: sellerKeys.products(),
    queryFn: fetchSellerProducts,
    enabled: isSignedIn === true,
  });
}

/** Returns the seller's dashboard statistics. */
export function useSellerStats() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: sellerKeys.stats(),
    queryFn: fetchSellerStats,
    enabled: isSignedIn === true,
  });
}

/** Returns all orders assigned to the active seller. */
export function useSellerOrders() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: sellerKeys.orders(),
    queryFn: fetchSellerOrders,
    enabled: isSignedIn === true,
  });
}
