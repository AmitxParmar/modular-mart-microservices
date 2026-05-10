"use client";

import { useAuthStore, UserRole } from "@/hooks/use-auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, Store, User } from "lucide-react";
import { useRouter } from "next/navigation";


const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  ADMIN: <Shield className="w-4 h-4" />,
  SELLER: <Store className="w-4 h-4" />,
  CUSTOMER: <User className="w-4 h-4" />,
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  SELLER: "Seller Partner",
  CUSTOMER: "Customer",
};

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRole } = useAuthStore();
  const router = useRouter();

  console.log('RoleSwitcher Trace:', { roles, activeRole });

  if (roles.length <= 1) {
    console.log('RoleSwitcher: Hiding because roles.length <= 1', roles);
    return null;
  }

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    // Redirect to the appropriate dashboard root when switching roles
    const path = role.toLowerCase();
    router.push(`/dashboard/${path}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 rounded-full border-border/60 hover:bg-accent/50 transition-all"
            {...props}
          >
            {activeRole && ROLE_ICONS[activeRole]}
            <span className="text-sm font-medium">
              {activeRole ? ROLE_LABELS[activeRole] : "Select Role"}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-border/40 backdrop-blur-xl bg-background/95">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Switch Workspace
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border/40" />
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleChange(role)}
            className={`gap-3 p-2.5 cursor-pointer rounded-md transition-colors ${
              activeRole === role 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted/80 text-foreground"
            }`}
          >
            {ROLE_ICONS[role]}
            <div className="flex flex-col">
              <span className="text-sm">{ROLE_LABELS[role]}</span>
              {activeRole === role && (
                <span className="text-[10px] opacity-70">Active Workspace</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
