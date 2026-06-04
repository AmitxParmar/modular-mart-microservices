import Header from "@/common/header";
import DashboardSidebar from "@/common/dashboard-sidebar";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("flex flex-col min-h-screen w-full", jetbrainsMono.variable)}>
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

