// components/common/Header.tsx
"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";

import { Show, UserButton } from "@clerk/nextjs";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";
import { RoleSwitcher } from "@/features/auth/components/role-switcher";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./theme-button";
import { Input } from "@/components/ui/input";
import Cart from "@/features/cart";
import { Search } from "lucide-react";

export default function Header() {
  const { openDialog } = useAuthDialog();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-[1400px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          ModularMart
        </Link>

        {/* Navigation Menu for Categories */}
        <NavigationMenu className="hidden md:flex ml-8">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-accent/50 data-[state=open]:bg-accent/50">
                Categories
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-2 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                  <Link
                    href="/products/men"
                    className="block rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Men</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      Explore latest men&apos;s fashion
                    </div>
                  </Link>
                  <Link
                    href="/products/women"
                    className="block rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Women</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      Trending styles for women
                    </div>
                  </Link>
                  <Link
                    href="/products/electronics"
                    className="block rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Electronics</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      Gadgets and smart devices
                    </div>
                  </Link>
                  <Link
                    href="/products/home"
                    className="block rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Home & Living</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      Decor and furniture
                    </div>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Input */}
          <div className="hidden lg:flex relative items-center mr-2">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              className="rounded-full border border-border/60 bg-muted/30 pl-9 pr-4 py-1.5 text-sm h-9 w-64 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all"
            />
          </div>

          <ThemeToggle />
          
          <Show when="signed-in">
            <Link 
              href="/customer/orders" 
              className="hidden sm:flex flex-col items-start justify-center px-3 py-1 rounded-md hover:bg-accent/50 transition-colors group"
            >
              <span className="text-[10px] text-muted-foreground font-medium leading-none">Returns</span>
              <span className="text-sm font-bold leading-none mt-0.5 group-hover:text-primary">& Orders</span>
            </Link>
          </Show>


          <Cart />

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Auth Status Routing */}
          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <RoleSwitcher />
              <UserButton />
            </Show>

            <Show when="signed-out">
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-full px-5 font-medium shadow-sm hover:shadow-md transition-all"
                onClick={() => openDialog("signIn")}
              >
                Sign In
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}

