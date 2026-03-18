"use client";

import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="hidden lg:block w-72 shrink-0 ml-4">
            <div className="sticky top-24 flex flex-col gap-10 bg-card/60 backdrop-blur-2xl p-6 rounded-2xl shadow-md border border-border/40 border-b-4 border-b-primary/40">

                {/* Categories Filter */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 pb-3 border-b-2 border-border/60">Categories</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                        <li>
                            <Link href="/products/new" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">New Arrivals</Link>
                        </li>
                        <li>
                            <Link href="/products/men" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">Men's Fashion</Link>
                        </li>
                        <li>
                            <Link href="/products/women" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">Women's Fashion</Link>
                        </li>
                        <li>
                            <Link href="/products/electronics" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">Electronics</Link>
                        </li>
                        <li>
                            <Link href="/products/home" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">Home & Living</Link>
                        </li>
                        <li>
                            <Link href="/products/accessories" className="hover:text-primary transition-colors block px-2 py-1 rounded-md hover:bg-primary/5">Accessories</Link>
                        </li>
                    </ul>
                </div>

                {/* Price Filter */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 pb-3 border-b-2 border-border/60">Price Range</h3>
                    <div className="space-y-4 text-sm text-muted-foreground font-medium px-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">Under $50</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">$50 - $100</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">Over $100</span>
                        </label>
                    </div>
                </div>

                {/* Brands snippet */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 pb-3 border-b-2 border-border/60">Brands</h3>
                    <div className="space-y-4 text-sm text-muted-foreground font-medium px-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">Modular Apparel</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">TechNova</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <Input type="checkbox" className="!w-5 !h-5 !rounded-md border-input text-primary focus:ring-primary cursor-pointer transition-shadow" />
                            <span className="group-hover:text-foreground transition-colors">LuxeLiving</span>
                        </label>
                    </div>
                </div>

            </div>
        </aside>
    );
}
