"use client";

import Header from "@/common/header";
import Sidebar from "@/common/sidebar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 gap-12 pb-24">
        <Sidebar />
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
