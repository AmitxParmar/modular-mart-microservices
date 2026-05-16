import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CheckoutFlow, OrderSummary, StripeProvider, CheckoutAuthGuard } from "@/features/checkout";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <StripeProvider>
        {/* Simplified Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shopping
            </Link>
            <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
              ModularMart
            </Link>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Main Checkout Flow (Left Column) */}
            <div className="lg:col-span-7 xl:col-span-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-10">Checkout</h1>
              
              <CheckoutAuthGuard>
                <CheckoutFlow />
              </CheckoutAuthGuard>
            </div>

            {/* Order Summary (Right Column) */}
            <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 self-start">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              <div className="p-8 rounded-3xl bg-muted/30 border border-border/40">
                <OrderSummary />
              </div>
            </aside>

          </div>
        </main>
      </StripeProvider>

      {/* Trust Footer */}
      <footer className="mt-auto py-12 border-t border-border/40 bg-muted/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground space-y-4">
          <p>© 2026 ModularMart. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <span>Secure Checkout</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}