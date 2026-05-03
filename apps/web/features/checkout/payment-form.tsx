"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "An unexpected error occurred.");
      setIsLoading(false);
      return;
    }

    // SIMULATION: Since we don't have a backend to create a PaymentIntent,
    // we simulate a successful payment after a short delay.
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Order Placed Successfully!</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Thank you for your purchase. We&apos;ve sent a confirmation email to your inbox.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-background rounded-2xl border border-border/40 p-1">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <Button
        disabled={isLoading || !stripe || !elements}
        className="w-full h-14 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Place Order"
        )}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
        Secure SSL Encrypted Transaction
      </p>
    </form>
  );
}