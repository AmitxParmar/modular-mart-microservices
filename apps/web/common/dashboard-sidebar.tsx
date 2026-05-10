"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, UserRole } from "@/hooks/use-auth-store";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Activity,
  PlusCircle,
  Truck
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const DASHBOARD_LINKS: Record<UserRole, SidebarItem[]> = {
  ADMIN: [
    { title: "Overview", href: "/dashboard/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: "Users", href: "/dashboard/admin/users", icon: <Users className="w-4 h-4" /> },
    { title: "Products Approval", href: "/dashboard/admin/products", icon: <Package className="w-4 h-4" /> },
    { title: "Service Health", href: "/dashboard/admin/health", icon: <Activity className="w-4 h-4" /> },
    { title: "Platform Stats", href: "/dashboard/admin/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { title: "Global Settings", href: "/dashboard/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ],
  SELLER: [
    { title: "Dashboard", href: "/dashboard/seller", icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: "My Products", href: "/dashboard/seller/products", icon: <Package className="w-4 h-4" /> },
    { title: "Add Product", href: "/dashboard/seller/products/new", icon: <PlusCircle className="w-4 h-4" /> },
    { title: "Orders", href: "/dashboard/seller/orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { title: "Shipping", href: "/dashboard/seller/shipping", icon: <Truck className="w-4 h-4" /> },
    { title: "Earnings", href: "/dashboard/seller/analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ],
  CUSTOMER: [
    { title: "My Account", href: "/dashboard/customer", icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: "Order History", href: "/dashboard/customer/orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { title: "Address Book", href: "/dashboard/customer/addresses", icon: <Package className="w-4 h-4" /> },
    { title: "Settings", href: "/dashboard/customer/settings", icon: <Settings className="w-4 h-4" /> },
  ],
};

export default function DashboardSidebar() {
  const { activeRole } = useAuthStore();
  const pathname = usePathname();

  if (!activeRole) return null;

  const links = DASHBOARD_LINKS[activeRole];

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-28 flex flex-col gap-8 pr-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 px-3">
            {activeRole} Workspace
          </h3>
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <span className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {link.icon}
                  </span>
                  {link.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-border/40">
           <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <Settings className="w-4 h-4" />
            Account Preferences
          </Link>
        </div>
      </div>
    </aside>
  );
}
