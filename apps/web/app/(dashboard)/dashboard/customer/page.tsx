"use client";

import { useUser } from "@clerk/nextjs";
import { useUserOrders, useAddresses } from "@/features/user/queries";
import { DashboardHeader } from "@/features/user/components/dashboard/dashboard-header";
import { DashboardQuickActions } from "@/features/user/components/dashboard/dashboard-quick-actions";
import { RecentOrdersCard } from "@/features/user/components/dashboard/recent-orders-card";
import { DefaultAddressCard } from "@/features/user/components/dashboard/default-address-card";

/**
 * Main entry point for the Customer Dashboard page.
 * Uses a composition pattern to orchestrate various dashboard widgets.
 */
export default function CustomerDashboard() {
  const { user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useUserOrders();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Welcome Section */}
      <DashboardHeader user={user} />

      {/* 2. Quick Access Stats/Links */}
      <DashboardQuickActions 
        ordersCount={orders?.length} 
        addressesCount={addresses?.length} 
      />

      {/* 3. Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RecentOrdersCard 
          orders={orders} 
          isLoading={isLoadingOrders} 
        />

        <DefaultAddressCard 
          addresses={addresses} 
          isLoading={isLoadingAddresses} 
        />
      </div>
    </div>
  );
}
