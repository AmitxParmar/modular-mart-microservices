import { ShoppingCartIcon } from "@phosphor-icons/react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { CartItem } from "@/features/cart/cart-item";
import { useCart } from "@/hooks/use-cart";
import React, { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const Cart = () => {
  const { items } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cartQuantity = isMounted
    ? items.reduce((acc, item) => acc + item.quantity, 0)
    : 0;
  const cartTotal = isMounted
    ? items
        .reduce(
          (total, item) => total + Number(item.product.price) * item.quantity,
          0,
        )
        .toFixed(2)
    : "0.00";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors cursor-pointer outline-none">
        <ShoppingCartIcon className="h-5 w-5" />
        {cartQuantity > 0 && (
          <span className="absolute 0 top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
            {cartQuantity}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 border-l border-border/40 bg-background/95 backdrop-blur-2xl">
        <SheetHeader className="px-6 py-4 border-b border-border/40">
          <SheetTitle className="text-lg font-semibold tracking-tight">Shopping Cart</SheetTitle>
          <span className="text-sm text-muted-foreground">
            {isMounted ? items.length : 0} items
          </span>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isMounted || items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <ShoppingCartIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Your cart is empty.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-primary hover:underline text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  product={item.product}
                  quantity={item.quantity}
                />
              ))}
            </div>
          )}
        </div>

        {isMounted && items.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t border-border/40 bg-muted/10 flex flex-col gap-4">
            <div className="flex justify-between items-center w-full font-semibold text-lg">
              <span>Total</span>
              <span>${cartTotal}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full text-sm font-medium tracking-wide")}
            >
              Checkout
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
