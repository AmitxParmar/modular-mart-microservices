import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. Your order has been placed and is being processed.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <Link
            href="/customer/orders"
            className="flex items-center justify-center w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:shadow-lg transition-all"
          >
            View My Orders <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <Link
            href="/"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
