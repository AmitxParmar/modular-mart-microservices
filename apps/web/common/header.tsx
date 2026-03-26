// components/common/Header.tsx
"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { Show, UserButton } from "@clerk/nextjs";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";
import { Button, buttonVariants } from "@/components/ui/button";
import ThemeToggle from "./theme-button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/features/cart/cart-item";
import React from "react";

export default function Header() {
    const { openDialog } = useAuthDialog();
    const { items } = useCart();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const cartQuantity = isMounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;
    const cartTotal = isMounted ? items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0).toFixed(2) : '0.00';

    return (
        <header className="sticky border-8 rounded-full top-0 z-50 w-full border-background bg-foreground">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">

                {/* Logo */}
                <Link href="/" className="text-2xl text-primary font-black tracking-tight">
                    ModularMart
                </Link>

                {/* Navigation Menu for Categories */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className=" text-sm font-medium">Categories</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                                    <Link href="/products/men" className="block rounded-md p-3 hover:bg-accent transition-colors">
                                        <div className="text-sm font-medium">Men</div>
                                        <div className="text-xs text-muted-foreground mt-1">Explore latest men&apos;s fashion</div>
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
                        <Input
                            type="text"
                            placeholder="Search products..."
                            className="rounded-full border-2 focus-visible:ring-primary border-primary text-background px-4 py-1.5 text-lg h-10 w-64"
                        />
                    </div>

                    {/* Cart Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors cursor-pointer outline-none">
                            <ShoppingCartIcon className="h-6 w-6" />
                            {cartQuantity > 0 && (
                                <span className="absolute 0 top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                    {cartQuantity}
                                </span>
                            )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-4 py-2 font-semibold border-b border-border">
                                <span>Cart</span>
                                <span className="text-sm text-muted-foreground">{isMounted ? items.length : 0} items</span>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-4">
                                {!isMounted || items.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">Your cart is empty</div>
                                ) : (
                                    <div className="flex flex-col">
                                        {items.map((item) => (
                                            <CartItem key={item.product.id} product={item.product} quantity={item.quantity} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isMounted && items.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <div className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>${cartTotal}</span>
                                        </div>
                                        <Link href="/cart" className={buttonVariants({ variant: "default", className: "w-full mt-2" })}>
                                            Checkout
                                        </Link>
                                    </div>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}