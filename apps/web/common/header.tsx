// components/common/Header.tsx
"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { Show, UserButton } from "@clerk/nextjs";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";
import { Button } from "@/components/ui/button";

export default function Header() {
    const { openDialog } = useAuthDialog();

    return (
        <header className="sticky bg top-0 z-50 w-full border backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">

                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-tight">
                    ModularMart
                </Link>

                {/* Navigation Menu for Categories */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-transparent text-sm font-medium">Categories</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                                    <Link href="/products/men" className="block rounded-md p-3 hover:bg-accent transition-colors">
                                        <div className="text-sm font-medium">Men</div>
                                        <div className="text-xs text-muted-foreground mt-1">Explore latest men's fashion</div>
                                    </Link>
                                    <Link href="/products/women" className="block rounded-md p-3 hover:bg-accent transition-colors">
                                        <div className="text-sm font-medium">Women</div>
                                        <div className="text-xs text-muted-foreground mt-1">Trending styles for women</div>
                                    </Link>
                                    <Link href="/products/electronics" className="block rounded-md p-3 hover:bg-accent transition-colors">
                                        <div className="text-sm font-medium">Electronics</div>
                                        <div className="text-xs text-muted-foreground mt-1">Gadgets and smart devices</div>
                                    </Link>
                                    <Link href="/products/home" className="block rounded-md p-3 hover:bg-accent transition-colors">
                                        <div className="text-sm font-medium">Home & Living</div>
                                        <div className="text-xs text-muted-foreground mt-1">Decor and furniture</div>
                                    </Link>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Right-side actions */}
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Search Input */}
                    <div className="hidden lg:flex relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="rounded-full border border-input bg-secondary/30 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all w-64"
                        />
                    </div>

                    {/* Icons */}
                    <Link href="/cart" aria-label="Cart" className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
                        <ShoppingCartIcon className="h-6 w-6" />
                    </Link>

                    {/* Auth Status Routing */}
                    <div className="flex items-center">
                        <Show when="signed-in">
                            <UserButton />
                        </Show>

                        <Show when="signed-out">
                            <Button
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