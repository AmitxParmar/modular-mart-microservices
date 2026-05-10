"use client";

import Header from "@/common/header";
import DashboardSidebar from "@/common/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 gap-12 pb-24">
        <DashboardSidebar />
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
