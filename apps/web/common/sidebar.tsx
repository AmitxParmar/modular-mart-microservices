"use client";

import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Check } from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 flex flex-col gap-12 pr-6">

                {/* Categories Filter */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Categories</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li>
                            <Link href="/products/new" className="hover:text-primary transition-colors block">New Arrivals</Link>
                        </li>
                        <li>
                            <Link href="/products/men" className="hover:text-primary transition-colors block">Men&apos;s Fashion</Link>
                        </li>
                        <li>
                            <Link href="/products/women" className="hover:text-primary transition-colors block">Women&apos;s Fashion</Link>
                        </li>
                        <li>
                            <Link href="/products/electronics" className="hover:text-primary transition-colors block">Electronics</Link>
                        </li>
                        <li>
                            <Link href="/products/home" className="hover:text-primary transition-colors block">Home & Living</Link>
                        </li>
                        <li>
                            <Link href="/products/accessories" className="hover:text-primary transition-colors block">Accessories</Link>
                        </li>
                    </ul>
                </div>

                {/* Price Filter */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Price Range</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">Under $50</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">$50 - $100</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">Over $100</span>
                        </label>
                    </div>
                </div>

                {/* Brands snippet */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Brands</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">Modular Apparel</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">TechNova</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded transition-colors group-hover:border-primary">
                                <Input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                                <Check className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="group-hover:text-foreground transition-colors">LuxeLiving</span>
                        </label>
                    </div>
                </div>

            </div>
        </aside>
    );
}
