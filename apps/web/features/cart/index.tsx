import { ShoppingCartIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CartItem } from "@/features/cart/cart-item";
import { useCart } from "@/hooks/use-cart";
import React, { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

const Cart = () => {
  const { items } = useCart();
  const [isMounted, setIsMounted] = React.useState(false);

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
          <span className="text-sm text-muted-foreground">
            {isMounted ? items.length : 0} items
          </span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {!isMounted || items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Your cart is empty
            </div>
          ) : (
            <div className="flex flex-col">
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
          <>
            <DropdownMenuSeparator />
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${cartTotal}</span>
              </div>
              <Link
                href="/cart"
                className={buttonVariants({
                  variant: "default",
                  className: "w-full mt-2",
                })}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Cart;
