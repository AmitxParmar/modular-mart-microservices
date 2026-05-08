"use client";

import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";

export function OrderSummary() {
  const { items } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  );
  
  const shipping = items.length > 0 ? 15 : 0; // Flat mock shipping rate
  const total = subtotal + shipping;

  return (
    <div className="space-y-6">
      {/* Items List */}
      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-4">
            <div className="w-16 h-20 bg-muted/40 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border border-border/20">
               {/* Simplified icon if no image available */}
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-muted-foreground/20">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-foreground truncate">{item.product.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
            </div>
            <div className="text-sm font-bold text-foreground self-center">
              ${(Number(item.product.price) * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-6 border-t border-border/40">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium text-foreground">
            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-base pt-3 border-t border-border/40">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-black text-foreground text-xl tracking-tight">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <p className="text-[11px] text-primary font-medium leading-relaxed">
           You are saving $24.00 on this order with our current seasonal promotion.
        </p>
      </div>
    </div>
  );
}