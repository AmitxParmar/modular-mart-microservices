import { ProductsSection } from '@/features/products/products-section';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-muted/30 border border-border/40 p-8 md:p-16 lg:p-24 flex flex-col justify-center items-start">
        <div className="max-w-2xl z-10 space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Elevate Your Everyday <span className="text-primary">Essentials.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
            Discover a curated collection of thoughtfully designed products that blend seamlessly into your modern lifestyle.
          </p>
          <div className="pt-4">
            <Link
              href="#products"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-base transition-transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Shop New Arrivals
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        {/* Abstract decorative background shapes could go here if needed */}
      </section>

      {/* Trust Signals */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-border/40 py-8">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-bold text-foreground text-sm tracking-wide">Free Shipping</h4>
            <p className="text-xs">On all orders over $100</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-bold text-foreground text-sm tracking-wide">Secure Checkout</h4>
            <p className="text-xs">100% protected payments</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <RotateCcw className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-bold text-foreground text-sm tracking-wide">Easy Returns</h4>
            <p className="text-xs">30-day money back guarantee</p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <div id="products" className="scroll-mt-32">
        <ProductsSection />
      </div>
    </div>
  );
}
