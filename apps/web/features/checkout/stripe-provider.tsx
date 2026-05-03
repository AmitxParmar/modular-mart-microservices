"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/use-cart";
import { useMemo } from "react";

// Standard Stripe test public key
const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  
  // Calculate total for deferred mode
  const total = useMemo(() => {
    const subtotal = items.reduce(
      (acc, item) => acc + Number(item.product.price) * item.quantity,
      0
    );
    const shipping = items.length > 0 ? 1500 : 0; // 15.00 in cents
    return Math.round(subtotal * 100) + shipping;
  }, [items]);

  // If cart is empty, we don't need Stripe elements yet or we show placeholder
  const options = {
    mode: 'payment' as const,
    amount: total > 0 ? total : 1, // Must be > 0
    currency: 'usd',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'Geist, Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}